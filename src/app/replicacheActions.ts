/* eslint-disable @typescript-eslint/no-misused-promises */
"use client";

import type { Replicache } from "replicache";
import type { Mutators } from "@replicache/mutators";
import Ably from "ably";
import { env } from "~/env";

export const listen = (rep: Replicache<Mutators> | null) => {
  if (rep) {
    console.log("👂 listening");

    const ably = new Ably.Realtime.Promise({
      key: env.NEXT_PUBLIC_ABLY_API_KEY,
    });

    const channel = ably.channels.get("todomonster-todos");

    void channel.subscribe("poke-event", async () => {
      console.log("🫰 got poked");
      try {
        await rep.pull();
      } catch (error) {
        console.log("rep.pull() failed");
      }
    });
  }
};
