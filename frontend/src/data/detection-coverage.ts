import type { DetectionCoverageSource } from "@/lib/types";

/** Investigation Coverage treemap tiles — 7AI Alert Intelligence (image 3). */
export const DETECTION_COVERAGE: DetectionCoverageSource[] = [
  {
    name: "Microsoft Defender",
    total: 912,
    alerts: [
      { title: "Email reported by user as malware", count: 378, coverage: "full" },
      { title: "Suspicious PowerShell execution", count: 142, coverage: "majority" },
      { title: "Anonymous IP address activity", count: 98, coverage: "enriched" },
      { title: "Unusual sign-in from new location", count: 86, coverage: "partial" },
      { title: "Malware - Roblox.exe", count: 72, coverage: "full" },
      { title: "Credential access attempt", count: 54, coverage: "none" },
      { title: "Phishing link clicked", count: 82, coverage: "majority" },
    ],
  },
  {
    name: "SentinelOne",
    total: 598,
    alerts: [
      { title: "Ransomware activity detected", count: 124, coverage: "full" },
      { title: "Endpoint exploit attempt", count: 98, coverage: "majority" },
      { title: "Lateral movement via SMB", count: 76, coverage: "enriched" },
      { title: "Suspicious script block", count: 64, coverage: "partial" },
      { title: "Tampering with AV service", count: 52, coverage: "full" },
    ],
  },
  {
    name: "CrowdStrike",
    total: 512,
    alerts: [
      { title: "Identity anomaly - impossible travel", count: 88, coverage: "enriched" },
      { title: "Malicious file quarantined", count: 76, coverage: "full" },
      { title: "Privilege escalation attempt", count: 62, coverage: "majority" },
      { title: "C2 beacon detected", count: 48, coverage: "full" },
    ],
  },
  {
    name: "Splunk",
    total: 313,
    alerts: [
      { title: "Brute force authentication", count: 54, coverage: "partial" },
      { title: "Data exfiltration pattern", count: 42, coverage: "enriched" },
      { title: "Failed MFA attempts spike", count: 38, coverage: "majority" },
    ],
  },
  {
    name: "AWS GuardDuty",
    total: 142,
    alerts: [
      { title: "Crypto-mining EC2 instance", count: 28, coverage: "full" },
      { title: "Unusual API call volume", count: 22, coverage: "enriched" },
      { title: "S3 bucket public access", count: 18, coverage: "partial" },
    ],
  },
];

export const COVERAGE_COLORS: Record<string, string> = {
  full: "#9DC4E0",
  majority: "#4A7FD4",
  enriched: "#2D6CC8",
  partial: "#4A5568",
  none: "#1A1C1E",
};

export const COVERAGE_LABELS: Record<string, string> = {
  full: "Full",
  majority: "Majority",
  enriched: "Enriched",
  partial: "Partial",
  none: "None",
};
