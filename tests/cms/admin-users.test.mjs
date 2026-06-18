import test from "node:test";
import assert from "node:assert/strict";
import { assignAdminRole, removeAdminRole, roleId, setAdminUserActive } from "../../src/lib/cms/admin-users.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

function createAdminDb({ superAdmins = ["u1"] } = {}) {
  const state = {
    users: new Map([
      ["u1", { id: "u1", email: "one@example.com", is_active: 1 }],
      ["u2", { id: "u2", email: "two@example.com", is_active: 1 }]
    ]),
    roles: new Map(["editor", "reviewer", "viewer", "super_admin"].map((name) => [`role_${name}`, { id: `role_${name}`, name }])),
    userRoles: new Set(superAdmins.map((id) => `${id}:role_super_admin`))
  };
  return {
    state,
    prepare(sql) {
      const query = sql.replace(/\s+/g, " ").trim();
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          if (query.startsWith("SELECT id, email, name, is_active FROM admin_users")) {
            return state.users.get(this.values[0]) || null;
          }
          if (query.startsWith("SELECT id FROM admin_users")) {
            return state.users.has(this.values[0]) ? { id: this.values[0] } : null;
          }
          if (query.startsWith("SELECT COUNT(*) AS total")) {
            const excluding = this.values[0];
            let total = 0;
            for (const [id, user] of state.users) {
              if (excluding && id === excluding) continue;
              if (user.is_active !== 1) continue;
              if (state.userRoles.has(`${id}:role_super_admin`)) total += 1;
            }
            return { total };
          }
          return null;
        },
        async all() {
          if (query.startsWith("SELECT r.name")) {
            const userId = this.values[0];
            const results = [...state.userRoles]
              .filter((entry) => entry.startsWith(`${userId}:`))
              .map((entry) => ({ name: state.roles.get(entry.split(":")[1]).name }))
              .sort((a, b) => a.name.localeCompare(b.name));
            return { results };
          }
          return { results: [] };
        },
        async run() {
          if (query.startsWith("INSERT OR IGNORE INTO admin_user_roles")) {
            state.userRoles.add(`${this.values[0]}:${this.values[1]}`);
          }
          if (query.startsWith("DELETE FROM admin_user_roles")) {
            state.userRoles.delete(`${this.values[0]}:${this.values[1]}`);
          }
          if (query.startsWith("UPDATE admin_users SET is_active")) {
            state.users.get(this.values[2]).is_active = this.values[0];
          }
          return { success: true };
        }
      };
    }
  };
}

test("role ids are normalized and assign role writes relation", async () => {
  const db = createAdminDb();
  setCmsBindingsForTest({ CMS_DB: db });
  assert.equal(roleId("reviewer"), "role_reviewer");
  const result = await assignAdminRole("u2", "reviewer");
  assert.deepEqual(result.roles, ["reviewer"]);
  setCmsBindingsForTest(null);
});

test("cannot remove or disable the last active super admin", async () => {
  const db = createAdminDb({ superAdmins: ["u1"] });
  setCmsBindingsForTest({ CMS_DB: db });
  const actor = { id: "u1", email: "one@example.com", name: "One", roles: ["super_admin"] };
  await assert.rejects(() => removeAdminRole("u1", "super_admin", actor), /最后一个 super_admin/);
  await assert.rejects(() => setAdminUserActive("u1", false, actor), /最后一个 super_admin/);
  setCmsBindingsForTest(null);
});

test("can remove super admin when another active super admin remains", async () => {
  const db = createAdminDb({ superAdmins: ["u1", "u2"] });
  setCmsBindingsForTest({ CMS_DB: db });
  const actor = { id: "u1", email: "one@example.com", name: "One", roles: ["super_admin"] };
  const result = await removeAdminRole("u2", "super_admin", actor);
  assert.deepEqual(result.roles, []);
  setCmsBindingsForTest(null);
});
