"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Certificate = {
  id: string;
  title: string;
  eventName: string;
  type: "WON" | "PARTICIPATED";
  fileUrl: string;
  fileName: string;
  isSkillVibeEvent: boolean;
  coinsAwarded: number;
  createdAt: string;
  category: "Won" | "Participated" | "SkillVibe Events";
};

type CertificateResponse = {
  coins: number;
  certificates: Certificate[];
};

export default function CertificateManager({
  onCoinsChange,
}: {
  onCoinsChange?: (coins: number) => void;
}) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    eventName: "",
    type: "PARTICIPATED" as "WON" | "PARTICIPATED",
  });
  const [file, setFile] = useState<File | null>(null);

  const loadCertificates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/certificates/user");
      const data = (await res.json()) as CertificateResponse | { error?: string };

      if (!res.ok) {
        throw new Error(("error" in data && data.error) || "Failed to load certificates");
      }

      setCertificates((data as CertificateResponse).certificates);
      onCoinsChange?.((data as CertificateResponse).coins);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCertificates();
  }, []);

  const groupedCertificates = useMemo(
    () => ({
      won: certificates.filter((certificate) => certificate.category === "Won"),
      participated: certificates.filter(
        (certificate) => certificate.category === "Participated",
      ),
      skillVibe: certificates.filter(
        (certificate) => certificate.category === "SkillVibe Events",
      ),
    }),
    [certificates],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose a proof file before uploading.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("eventName", form.eventName);
      formData.append("type", form.type);
      formData.append("proofFile", file);

      const res = await fetch("/api/certificates", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload certificate");
      }

      setForm({
        title: "",
        eventName: "",
        type: "PARTICIPATED",
      });
      setFile(null);
      setSuccess(
        `${data.certificate.title} uploaded successfully. +${data.certificate.coinsAwarded} coins added.`,
      );
      onCoinsChange?.(data.coins);
      await loadCertificates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload certificate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="surface-card p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">
              Certificate Upload
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Upload achievement proofs to track wins, participation, and earn SkillVibe coins.
            </p>
          </div>

          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            Won: +50 | Participated: +20
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            required
            value={form.title}
            onChange={(event) =>
              setForm((current) => ({ ...current, title: event.target.value }))
            }
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-indigo-300"
            placeholder="Certificate title"
          />

          <input
            type="text"
            required
            value={form.eventName}
            onChange={(event) =>
              setForm((current) => ({ ...current, eventName: event.target.value }))
            }
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-indigo-300"
            placeholder="Event name"
          />

          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as "WON" | "PARTICIPATED",
              }))
            }
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 outline-none focus:border-indigo-300"
          >
            <option value="WON">Won</option>
            <option value="PARTICIPATED">Participated</option>
          </select>

          <input
            type="file"
            accept=".pdf,image/png,image/jpeg"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-white"
          />

          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? "Uploading..." : "Upload Certificate"}
            </button>

            <span className="text-sm text-neutral-500">
              Allowed: PDF, PNG, JPG | Max size: 5MB
            </span>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <CertificateColumn
          title="Won"
          description="Certificates marked as achievements and wins."
          certificates={groupedCertificates.won}
          loading={loading}
        />
        <CertificateColumn
          title="Participated"
          description="Participation proofs for external and campus events."
          certificates={groupedCertificates.participated}
          loading={loading}
        />
        <CertificateColumn
          title="SkillVibe Events"
          description="Auto-tracked certificates linked to SkillVibe events."
          certificates={groupedCertificates.skillVibe}
          loading={loading}
        />
      </div>
    </div>
  );
}

function CertificateColumn({
  title,
  description,
  certificates,
  loading,
}: {
  title: string;
  description: string;
  certificates: Certificate[];
  loading: boolean;
}) {
  return (
    <div className="surface-card p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
        <p className="mt-1 text-sm text-neutral-500">{description}</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="shimmer-skeleton h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
          No certificates in this category yet.
        </div>
      ) : (
        <div className="space-y-3">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4"
            >
              <p className="font-semibold text-neutral-900">{certificate.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{certificate.eventName}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
                  {certificate.type === "WON" ? "Won" : "Participated"}
                </span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  +{certificate.coinsAwarded} coins
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-neutral-500">
                  {new Date(certificate.createdAt).toLocaleDateString("en-IN")}
                </span>
                <Link
                  href={certificate.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  View Proof
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
