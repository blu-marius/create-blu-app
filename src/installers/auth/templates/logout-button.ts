export const LOGOUT_BUTTON_TEMPLATE = `"use client";

import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button variant="outline" type="submit">
        Sign out
      </Button>
    </form>
  );
}
`;
