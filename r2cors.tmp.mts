import 'dotenv/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
const c = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID!.trim()}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(), secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim() } });
const url = await getSignedUrl(c, new PutObjectCommand({ Bucket: process.env.R2_BUCKET!.trim(), Key: 'audio/x/x.webm', ContentType: 'audio/webm' }), { expiresIn: 60 });
for (const origin of ['http://localhost:3000', 'https://recursos-simect.vercel.app']) {
  const r = await fetch(url, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'content-type' } });
  console.log(origin, '->', r.status, 'allow-origin:', r.headers.get('access-control-allow-origin'));
}
