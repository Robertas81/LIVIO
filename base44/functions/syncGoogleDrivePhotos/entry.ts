import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { isJunglinster } from '../../shared/junglinsterGeo.ts';
import { resolveTakenAt } from '../../shared/parseTakenAt.ts';

// Max number of new images downloaded + re-uploaded per sync run, to stay within
// the function timeout. Subsequent runs pick up the rest.
const MAX_NEW_UPLOADS = 25;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const conn = await base44.asServiceRole.connectors.getConnection('googledrive');
    const accessToken = conn.accessToken;
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // List image files (newest first) with their media metadata (GPS + date).
    const fields =
      'files(id,name,mimeType,createdTime,imageMediaMetadata(location,time),thumbnailLink),nextPageToken';
    let pageToken = '';
    let allFiles = [];
    let pages = 0;
    while (pageToken !== null && pages < 5) {
      let url =
        'https://www.googleapis.com/drive/v3/files?pageSize=200&orderBy=createdTime desc&q=' +
        encodeURIComponent("mimeType contains 'image' and trashed=false") +
        '&fields=' +
        encodeURIComponent(fields);
      if (pageToken) url += '&pageToken=' + pageToken;
      const res = await fetch(url, { headers: authHeader });
      if (!res.ok) {
        const err = await res.text();
        return Response.json({ error: 'Drive API error', details: err }, { status: 502 });
      }
      const data = await res.json();
      allFiles.push(...(data.files || []));
      pageToken = data.nextPageToken || null;
      pages++;
    }

    // Keep only photos geotagged within the Junglinster site radius.
    const candidates = allFiles.filter((f) => {
      const loc = f.imageMediaMetadata && f.imageMediaMetadata.location;
      return loc && isJunglinster(loc.latitude, loc.longitude);
    });

    // Dedup against already-synced photos (by Google Drive file id).
    const existing = await base44.asServiceRole.entities.SitePhoto.list('-created_date', 500);
    const existingIds = new Set(existing.map((p) => p.external_id).filter(Boolean));

    let created = 0;
    let skipped = 0;
    for (const f of candidates) {
      if (created >= MAX_NEW_UPLOADS) {
        // Remaining candidates will be picked up on the next sync run.
        break;
      }
      if (existingIds.has(f.id)) {
        skipped++;
        continue;
      }
      let file_url = f.thumbnailLink;
      // Download the original and re-upload to our public storage so the photo
      // remains available even if the Drive source is removed.
      try {
        const dlRes = await fetch(
          'https://www.googleapis.com/drive/v3/files/' + f.id + '?alt=media',
          { headers: authHeader }
        );
        if (dlRes.ok) {
          const blob = await dlRes.blob();
          const up = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file: blob });
          if (up && up.file_url) file_url = up.file_url;
        }
      } catch (e) {
        // Fall back to the Drive thumbnail link if download/re-upload fails.
      }

      const loc = f.imageMediaMetadata.location;
      const takenAt = resolveTakenAt(f.imageMediaMetadata?.time, f.name);
      await base44.asServiceRole.entities.SitePhoto.create({
        file_url,
        thumbnail_url: f.thumbnailLink || file_url,
        ...(takenAt ? { taken_at: takenAt } : {}),
        latitude: loc.latitude,
        longitude: loc.longitude,
        location_name: 'Junglinster',
        source: 'google_drive',
        external_id: f.id,
        caption: f.name
      });
      created++;
    }

    return Response.json({
      status: 'ok',
      scanned: allFiles.length,
      candidates: candidates.length,
      created,
      skipped
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}