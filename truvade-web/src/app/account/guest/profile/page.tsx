"use client";

import { redirect } from "next/navigation";

export default function GuestProfileRedirect() {
  redirect("/account/profile");
}
