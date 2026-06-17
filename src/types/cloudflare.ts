export type CmsBindings = {
  CMS_DB?: D1Database;
  CMS_MEDIA?: R2Bucket;
  CF_ACCESS_AUDIENCE?: string;
  CF_ACCESS_ISSUER?: string;
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_JWKS_URL?: string;
  CMS_ALLOW_LOCAL_ADMIN?: string;
  CMS_LOCAL_ADMIN_EMAIL?: string;
  CMS_PUBLIC_D1_READS?: string;
};
