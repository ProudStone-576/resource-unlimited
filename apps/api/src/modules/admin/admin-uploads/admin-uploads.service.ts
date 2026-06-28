import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'node:crypto';

export interface CloudinarySignResult {
  provider: 'cloudinary';
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId?: string;
  signature: string;
  uploadUrl: string;
}

export interface S3PresignResult {
  provider: 's3';
  bucket: string;
  region: string;
  key: string;
  url: string;
  headers: Record<string, string>;
  publicUrl: string;
  expiresInSec: number;
}

@Injectable()
export class AdminUploadsService {
  constructor(private readonly config: ConfigService) {}

  signCloudinary(input: { folder: string; publicId?: string }): CloudinarySignResult {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) {
      throw new BadRequestException('Cloudinary is not configured');
    }
    const timestamp = Math.floor(Date.now() / 1000);
    const params: Record<string, string | number> = {
      folder: input.folder,
      timestamp,
    };
    if (input.publicId) params.public_id = input.publicId;
    const toSign = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    const signature = createHash('sha1').update(toSign + apiSecret).digest('hex');
    const result: CloudinarySignResult = {
      provider: 'cloudinary',
      cloudName,
      apiKey,
      timestamp,
      folder: input.folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    };
    if (input.publicId) result.publicId = input.publicId;
    return result;
  }

  signS3Put(input: { key: string; contentType: string; bucket?: string; expiresInSec: number }): S3PresignResult {
    const region = this.config.get<string>('S3_REGION');
    const bucket = input.bucket ?? this.config.get<string>('S3_BUCKET');
    const accessKey = this.config.get<string>('S3_ACCESS_KEY_ID');
    const secret = this.config.get<string>('S3_SECRET_ACCESS_KEY');
    const endpoint = this.config.get<string>('S3_ENDPOINT'); // optional for non-AWS providers
    if (!region || !bucket || !accessKey || !secret) {
      throw new BadRequestException('S3 storage is not configured');
    }

    const host = endpoint
      ? endpoint.replace(/^https?:\/\//, '')
      : `${bucket}.s3.${region}.amazonaws.com`;
    const encodedKey = input.key.split('/').map(encodeURIComponent).join('/');
    const canonicalUri = `/${encodedKey}`;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const dateStamp = amzDate.slice(0, 8);
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
    const credential = `${accessKey}/${credentialScope}`;
    const signedHeaders = 'host';
    const expiresInSec = input.expiresInSec;

    const query: Record<string, string> = {
      'X-Amz-Algorithm': algorithm,
      'X-Amz-Credential': credential,
      'X-Amz-Date': amzDate,
      'X-Amz-Expires': String(expiresInSec),
      'X-Amz-SignedHeaders': signedHeaders,
    };
    const canonicalQuery = Object.keys(query)
      .sort()
      .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k] as string)}`)
      .join('&');

    const canonicalHeaders = `host:${host}\n`;
    const payloadHash = 'UNSIGNED-PAYLOAD';
    const canonicalRequest = ['PUT', canonicalUri, canonicalQuery, canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const stringToSign = [algorithm, amzDate, credentialScope, createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');

    const kDate = createHmac('sha256', 'AWS4' + secret).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(region).digest();
    const kService = createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = createHmac('sha256', kService).update('aws4_request').digest();
    const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    const url = `https://${host}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
    const publicUrl = `https://${host}${canonicalUri}`;
    return {
      provider: 's3',
      bucket,
      region,
      key: input.key,
      url,
      publicUrl,
      headers: { 'content-type': input.contentType },
      expiresInSec,
    };
  }
}
