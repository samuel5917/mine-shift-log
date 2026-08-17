import { supabase } from "@/integrations/supabase/client";

export type AssetKind = "blend" | "diretriz";

export type DashboardAsset = {
  kind: AssetKind;
  path: string;
  fileName: string;
  mimeType: string;
  updatedAt: string;
  url: string;
};

const BUCKET = "dashboard";

export const BLEND_ACCEPT = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

function extOf(file: File): string {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/").pop() ?? "bin";
}

export async function fetchAsset(kind: AssetKind): Promise<DashboardAsset | null> {
  const { data, error } = await supabase
    .from("dashboard_assets")
    .select("*")
    .eq("kind", kind)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.path, 60 * 60);

  return {
    kind,
    path: data.path,
    fileName: data.file_name,
    mimeType: data.mime_type,
    updatedAt: data.updated_at,
    url: signed?.signedUrl ?? "",
  };
}

export async function uploadAsset(kind: AssetKind, file: File): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sessão expirada.");

  const previous = await supabase
    .from("dashboard_assets")
    .select("path")
    .eq("kind", kind)
    .maybeSingle();

  const path = `${uid}/${kind}-${Date.now()}.${extOf(file)}`;

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (upErr) throw upErr;

  const { error } = await supabase.from("dashboard_assets").upsert(
    {
      user_id: uid,
      kind,
      path,
      file_name: file.name || `${kind}.${extOf(file)}`,
      mime_type: file.type,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind" },
  );
  if (error) throw error;

  if (previous.data?.path && previous.data.path !== path) {
    await supabase.storage.from(BUCKET).remove([previous.data.path]);
  }
}

export async function removeAsset(kind: AssetKind): Promise<void> {
  const { data } = await supabase
    .from("dashboard_assets")
    .select("path")
    .eq("kind", kind)
    .maybeSingle();

  const { error } = await supabase.from("dashboard_assets").delete().eq("kind", kind);
  if (error) throw error;

  if (data?.path) await supabase.storage.from(BUCKET).remove([data.path]);
}
