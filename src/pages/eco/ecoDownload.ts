function escCell(c: string) {
  return `"${String(c).replace(/"/g, '""')}"`
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const body = [headers.map(escCell).join(','), ...rows.map((r) => r.map((c) => escCell(String(c))).join(','))].join('\n')
  const blob = new Blob([`\ufeff${body}`], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
