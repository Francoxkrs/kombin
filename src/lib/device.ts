import "server-only";
import { cookies } from "next/headers";
import { DEVICE_COOKIE } from "./device-cookie";

/** Id anônimo do aparelho, criado pelo proxy na primeira visita. */
export async function getDeviceId(): Promise<string> {
  const jar = await cookies();
  return jar.get(DEVICE_COOKIE)?.value ?? "sem-cookie";
}
