'use client';

export default function UploadArea() {
  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    const data = await res.json();
    alert(`Saved to: ${data.savedPath}`);
  }

  return (
    <input type="file" onChange={onChange} className="hidden" id="uploader" />
  );
}
