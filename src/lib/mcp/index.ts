import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listDonors from "./tools/list-donors";
import getDonor from "./tools/get-donor";
import listDonations from "./tools/list-donations";
import recordDonation from "./tools/record-donation";
import listClusters from "./tools/list-clusters";
import listDuaRequests from "./tools/list-dua-requests";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "ajmeer-gate-campus-karad",
  title: "Ajmeer Gate Campus Karad",
  version: "0.1.0",
  instructions:
    "Tools for the Ajmeer Gate Campus Karad donation system. Search donors, read donation history and reports, record new donations, list clusters, and review dua (prayer) requests. Always find a donor with list_donors before recording a donation.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listDonors, getDonor, listDonations, recordDonation, listClusters, listDuaRequests],
});
