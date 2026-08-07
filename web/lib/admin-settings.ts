import { SESSION_COOKIE } from "@/lib/session";

export interface EnvVarStatus {
  key: string;
  label: string;
  description: string;
  set: boolean;
  displayValue?: string;
}

export interface SettingsGroup {
  title: string;
  items: EnvVarStatus[];
}

function bootstrapEmailCount(): number {
  return (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean).length;
}

export function getSettingsGroups(): SettingsGroup[] {
  const bootstrapCount = bootstrapEmailCount();

  return [
    {
      title: "Environment",
      items: [
        {
          key: "NODE_ENV",
          label: "Environment",
          description:
            "Controls the session cookie's `secure` flag and general error verbosity.",
          set: true,
          displayValue: process.env.NODE_ENV ?? "development",
        },
        {
          key: "APP_URL",
          label: "App URL",
          description: "Base URL used for the Spurs OAuth redirect URI.",
          set: Boolean(process.env.APP_URL),
          displayValue: process.env.APP_URL,
        },
      ],
    },
    {
      title: "Database",
      items: [
        {
          key: "DATABASE_URL",
          label: "Database connection",
          description:
            "Neon Postgres connection string. lib/db/index.ts throws at import time if this is missing.",
          set: Boolean(process.env.DATABASE_URL),
        },
      ],
    },
    {
      title: "Auth & Roles",
      items: [
        {
          key: "AUTH_SESSION_SECRET",
          label: "Session signing secret",
          description:
            "Signs the JWT session cookie. Required — session issuance throws without it.",
          set: Boolean(process.env.AUTH_SESSION_SECRET),
        },
        {
          key: "ADMIN_BOOTSTRAP_EMAILS",
          label: "Admin bootstrap emails",
          description:
            "Emails auto-granted admin on first login/signup. Use the Users page for routine promotions instead of adding more here.",
          set: bootstrapCount > 0,
          displayValue:
            bootstrapCount > 0
              ? `${bootstrapCount} email${bootstrapCount === 1 ? "" : "s"} configured`
              : undefined,
        },
        {
          key: "SESSION_COOKIE",
          label: "Session cookie name",
          description: "Cookie name the session JWT is stored under (not a secret, fixed in code).",
          set: true,
          displayValue: SESSION_COOKIE,
        },
      ],
    },
    {
      title: "Spurs OAuth",
      items: [
        {
          key: "SPURS_CLIENT_ID",
          label: "Client ID",
          description: "OAuth client ID registered with Spurs Accounts.",
          set: Boolean(process.env.SPURS_CLIENT_ID),
        },
        {
          key: "SPURS_CLIENT_SECRET",
          label: "Client secret",
          description: "OAuth client secret. Never displayed here.",
          set: Boolean(process.env.SPURS_CLIENT_SECRET),
        },
        {
          key: "SPURS_ISSUER",
          label: "Issuer URL",
          description: "Spurs Accounts OIDC issuer used for discovery.",
          set: Boolean(process.env.SPURS_ISSUER),
          displayValue: process.env.SPURS_ISSUER,
        },
      ],
    },
    {
      title: "Object Storage",
      items: [
        {
          key: "STORAGE_BUCKET",
          label: "Bucket",
          description:
            "Physical S3-compatible bucket. All projects share one bucket, namespaced by project/bucket name.",
          set: Boolean(process.env.STORAGE_BUCKET),
          displayValue: process.env.STORAGE_BUCKET,
        },
        {
          key: "MINIO_ENDPOINT",
          label: "Endpoint",
          description: "S3-compatible storage endpoint (public endpoint takes priority if both are set).",
          set: Boolean(process.env.MINIO_ENDPOINT || process.env.MINIO_PUBLIC_ENDPOINT),
          displayValue: process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT,
        },
        {
          key: "MINIO_ACCESS_KEY / MINIO_SECRET_KEY",
          label: "Storage credentials",
          description: "S3 client credentials. Never displayed here.",
          set: Boolean(process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY),
        },
        {
          key: "REGION",
          label: "Region",
          description: "S3 client region.",
          set: Boolean(process.env.REGION),
          displayValue: process.env.REGION,
        },
      ],
    },
  ];
}
