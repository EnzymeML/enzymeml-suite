import { invoke } from "@tauri-apps/api/tauri";
import { Vessel } from "enzymeml";

export async function createVessel(): Promise<string> {
  try {
    return await invoke("create_vessel", {});
  } catch (error) {
    throw new Error("Error invoking command: " + error);
  }
}

export async function listVessels(): Promise<[string, string][]> {
  try {
    return await invoke("list_vessels", {});
  } catch (error) {
    throw new Error("Error invoking command: " + error);
  }
}

export async function getVessel(id: string): Promise<Vessel> {
  try {
    const vessel = await invoke("get_vessel", { id });
    console.log("GETTING VESSEL", vessel);
    return vessel as Vessel;
  } catch (error) {
    throw new Error("Error invoking command: " + error);
  }
}

export async function updateVessel(id: string, data: Vessel): Promise<void> {
  try {
    await invoke("update_vessel", { id: id, data: data });
  } catch (error) {
    throw new Error("Error invoking command: " + error);
  }
}

export async function deleteVessel(id: string): Promise<void> {
  try {
    await invoke("delete_vessel", { id });
  } catch (error) {
    throw new Error("Error invoking command: " + error);
  }
}
