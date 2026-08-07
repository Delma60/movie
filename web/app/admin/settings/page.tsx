import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSettingsGroups } from "@/lib/admin-settings";

export default async function AdminSettingsPage() {
  await requireRole("admin", "/admin");

  const groups = getSettingsGroups();
  const missing = groups.flatMap((group) =>
    group.items.filter((item) => !item.set),
  );

  return (
    <main className="admin-page admin-settings-page">
      <div className="admin-page-head">
        <div>
          <h1>Settings</h1>
          <p>
            Read-only view of the environment configuration Velvet is running
            with.
          </p>
        </div>
      </div>

      {missing.length > 0 && (
        <div className="admin-form-error admin-settings-warning">
          <AlertTriangle size={16} strokeWidth={2.25} />
          <span>
            {missing.length} variable{missing.length === 1 ? "" : "s"} not set:{" "}
            {missing.map((item) => item.key).join(", ")}
          </span>
        </div>
      )}

      <div className="admin-settings-groups">
        {groups.map((group) => (
          <section
            key={group.title}
            className="admin-panel admin-settings-group"
          >
            <div className="admin-panel-head">
              <h2>{group.title}</h2>
            </div>
            <div className="admin-settings-rows">
              {group.items.map((item) => (
                <div key={item.key} className="admin-settings-row">
                  <div className="admin-settings-row-main">
                    <span className="admin-settings-label">{item.label}</span>
                    <span className="admin-settings-desc">
                      {item.description}
                    </span>
                    <code className="admin-settings-key">{item.key}</code>
                  </div>
                  <div className="admin-settings-row-status">
                    {item.set ? (
                      <span className="admin-settings-status admin-settings-status-set">
                        <CheckCircle2 size={13} strokeWidth={2.5} />
                        {item.displayValue ?? "Set"}
                      </span>
                    ) : (
                      <span className="admin-settings-status admin-settings-status-missing">
                        <AlertTriangle size={13} strokeWidth={2.5} />
                        Not set
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
