const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type AuthResponse = {
  accessToken: string;
  user: { id: string; email: string; name: string | null };
  organization: {
    id: string;
    name: string;
    country: string;
    currency: string;
    defaultTaxPercent?: string;
  };
};

export type ProjectDto = {
  id: string;
  title: string;
  projectType: string;
  status: string;
  location?: string | null;
  customer?: { name: string };
  updatedAt: string;
};

export type ProjectDetail = ProjectDto & {
  projectDescription?: string | null;
  createdAt: string;
};

export type DocumentDto = {
  id: string;
  projectId: string;
  fileName: string;
  mimeType: string;
  status: string;
  jobId?: string;
  extraction?: unknown;
  error?: string;
  createdAt: string;
};

function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function parseError(res: Response) {
  const body = await res.json().catch(() => ({}));
  const message =
    body?.message ??
    body?.error?.message ??
    `Request failed (${res.status})`;
  throw new Error(typeof message === "string" ? message : JSON.stringify(message));
}

export async function register(input: {
  email: string;
  password: string;
  name?: string;
  organizationName?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function googleSignIn(idToken: string): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export type OrgInviteDto = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

export async function listOrganizationInvites(
  token: string,
): Promise<OrgInviteDto[]> {
  const res = await fetch(`${API_URL}/organization/invites`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createOrganizationInvite(
  token: string,
  email: string,
): Promise<{ acceptUrl: string; email: string }> {
  const res = await fetch(`${API_URL}/organization/invites`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ email, role: "MEMBER" }),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function acceptOrganizationInvite(input: {
  token: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_URL}/organization/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function reindexProjectEmbeddings(
  token: string,
  projectId: string,
): Promise<{ chunks: number }> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/documents/reindex-embeddings`,
    { method: "POST", headers: authHeaders(token) },
  );
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function listProjects(token: string): Promise<ProjectDto[]> {
  const res = await fetch(`${API_URL}/projects`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createProject(
  token: string,
  input: {
    title: string;
    projectType: string;
    projectDescription?: string;
    location?: string;
    customerName?: string;
  },
): Promise<ProjectDto> {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function getProject(
  token: string,
  projectId: string,
): Promise<ProjectDetail> {
  const res = await fetch(`${API_URL}/projects/${projectId}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function listProjectDocuments(
  token: string,
  projectId: string,
): Promise<DocumentDto[]> {
  const res = await fetch(`${API_URL}/projects/${projectId}/documents`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export type ChatMessageDto = {
  id: string;
  role: string;
  content: string;
  metadata?: unknown;
  createdAt: string;
};

export type ChatResponse = {
  reply: string;
  agent: unknown;
  missingInformation: string[];
  suggestedQuestions: string[];
};

export async function listChatMessages(
  token: string,
  projectId: string,
): Promise<ChatMessageDto[]> {
  const res = await fetch(`${API_URL}/projects/${projectId}/chat/messages`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function sendChatMessage(
  token: string,
  projectId: string,
  message: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/projects/${projectId}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message, stream: false }),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function streamChatMessage(
  token: string,
  projectId: string,
  message: string,
  handlers: {
    onToken: (text: string) => void;
    onDone: () => void;
    onError: (message: string) => void;
  },
): Promise<void> {
  const res = await fetch(`${API_URL}/projects/${projectId}/chat`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ message, stream: true }),
  });
  if (!res.ok || !res.body) {
    await parseError(res);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const json = JSON.parse(line.slice(5).trim()) as {
        type: string;
        text?: string;
        message?: string;
      };
      if (json.type === "token" && json.text) handlers.onToken(json.text);
      if (json.type === "done") handlers.onDone();
      if (json.type === "error") handlers.onError(json.message ?? "Error");
    }
  }
}

export type EstimateLineItemDto = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  labourHours?: string | null;
  labourRate?: string | null;
  discountPercent: string;
  taxPercent: string;
  priceSource: string;
  confirmed: boolean;
};

export type EstimateDto = {
  id: string;
  projectId: string;
  version: number;
  tier: string;
  totals: Record<string, string>;
  lineItems: EstimateLineItemDto[];
  warnings?: string[];
  createdAt: string;
};

export async function getProjectEstimate(
  token: string,
  projectId: string,
): Promise<EstimateDto | null> {
  const res = await fetch(`${API_URL}/projects/${projectId}/estimate`, {
    headers: authHeaders(token),
  });
  if (res.status === 404) return null;
  if (!res.ok) await parseError(res);
  const body = await res.json();
  return body === null ? null : body;
}

export async function generateProjectEstimate(
  token: string,
  projectId: string,
): Promise<EstimateDto> {
  const res = await fetch(`${API_URL}/projects/${projectId}/estimate/generate`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function updateEstimateLineItem(
  token: string,
  estimateId: string,
  itemId: string,
  patch: Partial<EstimateLineItemDto>,
): Promise<EstimateDto> {
  const res = await fetch(
    `${API_URL}/estimates/${estimateId}/line-items/${itemId}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function generateTierEstimates(
  token: string,
  projectId: string,
): Promise<{ tiers: EstimateDto[] }> {
  const res = await fetch(
    `${API_URL}/projects/${projectId}/estimate/tiers/generate`,
    { method: "POST", headers: authHeaders(token) },
  );
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function getTierEstimates(
  token: string,
  projectId: string,
): Promise<EstimateDto[]> {
  const res = await fetch(`${API_URL}/projects/${projectId}/estimate/tiers`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export type ValidationResultDto = {
  status: "PASS" | "WARNING" | "BLOCKED";
  issues: string[];
  warnings: string[];
  suggestions: string[];
};

export async function validateProject(
  token: string,
  projectId: string,
): Promise<ValidationResultDto> {
  const res = await fetch(`${API_URL}/projects/${projectId}/validate`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export type CatalogItemDto = {
  id: string;
  sku: string;
  name: string;
  category: string;
  kind?: string;
  unit: string;
  unitPrice: string;
  taxPercent: string;
};

export type OrganizationSettingsDto = {
  id: string;
  name: string;
  country: string;
  currency: string;
  defaultTaxPercent: string;
};

export async function getOrganizationSettings(
  token: string,
): Promise<OrganizationSettingsDto> {
  const res = await fetch(`${API_URL}/organization/settings`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function updateOrganizationSettings(
  token: string,
  input: { defaultTaxPercent: string },
): Promise<OrganizationSettingsDto> {
  const res = await fetch(`${API_URL}/organization/settings`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function listCatalogItems(
  token: string,
  kind?: "material" | "labour",
): Promise<CatalogItemDto[]> {
  const qs = kind ? `?kind=${kind}` : "";
  const res = await fetch(`${API_URL}/catalog/items${qs}`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createCatalogItem(
  token: string,
  input: {
    sku: string;
    name: string;
    category: string;
    unit: string;
    unitPrice: string;
    taxPercent?: string;
    kind?: "material" | "labour";
  },
): Promise<CatalogItemDto> {
  const res = await fetch(`${API_URL}/catalog/items`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function addEstimateLineFromCatalog(
  token: string,
  estimateId: string,
  input: { catalogItemId: string; quantity?: string },
): Promise<EstimateDto> {
  const res = await fetch(
    `${API_URL}/estimates/${estimateId}/line-items/from-catalog`,
    {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify(input),
    },
  );
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function confirmEstimateLineItem(
  token: string,
  estimateId: string,
  itemId: string,
): Promise<EstimateDto> {
  const res = await fetch(
    `${API_URL}/estimates/${estimateId}/line-items/${itemId}/confirm`,
    { method: "POST", headers: authHeaders(token) },
  );
  if (!res.ok) await parseError(res);
  return res.json();
}

export type ProposalSectionDto = {
  id: string;
  title: string;
  content: string;
  order: number;
};

export type ProposalDto = {
  id: string;
  projectId: string;
  estimateId?: string | null;
  title?: string | null;
  version: number;
  tier: string;
  sections: ProposalSectionDto[];
  status: string;
  hasPdf?: boolean;
  createdAt: string;
};

export async function getLatestProposal(
  token: string,
  projectId: string,
): Promise<ProposalDto | null> {
  const res = await fetch(`${API_URL}/projects/${projectId}/proposals/latest`, {
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  const body = await res.json();
  return body ?? null;
}

export async function generateProposal(
  token: string,
  projectId: string,
): Promise<ProposalDto> {
  const res = await fetch(`${API_URL}/projects/${projectId}/proposals/generate`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function updateProposalSection(
  token: string,
  proposalId: string,
  sectionId: string,
  content: string,
): Promise<ProposalDto> {
  const res = await fetch(
    `${API_URL}/proposals/${proposalId}/sections/${sectionId}`,
    {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function approveProposal(
  token: string,
  proposalId: string,
): Promise<ProposalDto> {
  const res = await fetch(`${API_URL}/proposals/${proposalId}/approve`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function createProposalShare(
  token: string,
  proposalId: string,
): Promise<{ shareId: string; url: string; expiresAt: string | null }> {
  const res = await fetch(`${API_URL}/proposals/${proposalId}/share`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export type SharedProposalDto = {
  title?: string | null;
  version: number;
  organizationName: string;
  projectTitle: string;
  customerName?: string;
  sections: ProposalSectionDto[];
  hasPdf: boolean;
};

export async function getSharedProposal(
  shareToken: string,
): Promise<SharedProposalDto> {
  const res = await fetch(`${API_URL}/shared/proposals/${shareToken}`);
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function generateProposalPdf(
  token: string,
  proposalId: string,
): Promise<unknown> {
  const res = await fetch(`${API_URL}/proposals/${proposalId}/pdf`, {
    method: "POST",
    headers: authHeaders(token),
  });
  if (!res.ok) await parseError(res);
  return res.json();
}

export async function uploadProjectDocument(
  token: string,
  projectId: string,
  file: File,
): Promise<{ document: DocumentDto; jobId: string; status: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/projects/${projectId}/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) await parseError(res);
  return res.json();
}
