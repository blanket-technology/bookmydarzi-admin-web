export const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "user", label: "Customer" },
  { value: "employee", label: "Employee" },
  { value: "tailor", label: "Tailor" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Super Admin" },
];

export const ROLE_BADGE = {
  user: "bg-blue-100 text-blue-700",
  tailor: "bg-indigo-100 text-indigo-700",
  employee: "bg-teal-100 text-teal-700",
  admin: "bg-amber-100 text-amber-700",
  superadmin: "bg-rose-100 text-rose-700",
};

export const ROLE_LABEL = {
  user: "Customer",
  employee: "Employee",
  tailor: "Tailor",
  admin: "Admin",
  superadmin: "Super Admin",
};

export const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

export const STAFF_ROLES_BY_CREATOR = {
  superadmin: [
    { value: "employee", label: "Employee" },
    { value: "tailor", label: "Tailor" },
    { value: "admin", label: "Admin" },
    { value: "superadmin", label: "Super Admin" },
  ],
  admin: [
    { value: "employee", label: "Employee" },
    { value: "tailor", label: "Tailor" },
  ],
};

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 25;
export const DEFAULT_ROLE_FILTER = "user";

export const INPUT_CLASS =
  "w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none " +
  "focus:border-teal-500 bg-gray-50 focus:bg-white transition-colors";

export const USER_TABLE_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "role", label: "Role" },
  { key: "verification", label: "Verified", align: "center" },
  { key: "joined", label: "Joined" },
];
