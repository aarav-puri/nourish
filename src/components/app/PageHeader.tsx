/**
 * The title block shared by Scan, History and Settings: one display title, set like the landing headline,
 * an optional line under it, and any page actions, centered on the column.
 */
export default function PageHeader({
  id,
  title,
  subtitle,
  actions,
}: {
  id?: string
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <header className="app-page-header">
      <h1 id={id} className="app-page-title">
        {title}
      </h1>
      {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </header>
  )
}
