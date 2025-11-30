// src/lib/babies/dto.ts
import type { BabyDoc, Invite, Parent } from "@/lib/babies";

export type InviteDto = Omit<Invite, "invitedAt"> & { invitedAt: string };

export type BabyDto = {
  _id: string;
  name: string;
  createdAt?: string;
  parents: Parent[];
  invites?: InviteDto[];
};

function invitesToDto(invites?: Invite[]): InviteDto[] | undefined {
  if (!invites) return undefined;
  return invites.map((invite) => ({
    ...invite,
    invitedAt: invite.invitedAt.toISOString?.() ?? new Date(invite.invitedAt).toISOString(),
  }));
}

export function babyDocToDto(doc: BabyDoc): BabyDto {
  return {
    _id: doc._id.toHexString(),
    name: doc.name,
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : undefined,
    parents: doc.parents,
    invites: invitesToDto(doc.invites),
  };
}
