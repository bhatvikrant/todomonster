"use client";

import { Replicache } from "replicache";

import mutators from "./mutators";
import type { Mutators } from "./mutators";
import { env } from "~/env";

const getRowVersioningReplicache = (): Replicache<Mutators> | null => {
  const rep =
    typeof window !== "undefined"
      ? new Replicache({
          name: "unique-and-user-specific-replicache-database-name",
          licenseKey: env.NEXT_PUBLIC_REPLICACHE_LICENSE_KEY,
          pushURL: "/api/replicache/push",
          pullURL: "/api/replicache/pull",
          mutators,
        })
      : null;

  return rep;
};

export {
  // eslint-disable-next-line import/prefer-default-export
  getRowVersioningReplicache,
};
