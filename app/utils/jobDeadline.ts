type DeadlineJob = {
  deadline?: string | Date | null
  created_at?: string | Date | null
  createdAt?: string | Date | null
}

const dateOnlyPattern = /^(\d{4})-(\d{2})-(\d{2})$/
const noDeadlineCutoffDays = 60
const millisecondsPerDay = 24 * 60 * 60 * 1000

const parseDate = (value?: string | Date | null) => {
  if (!value) return null

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null

    return value
  }

  const trimmed = value.toString().trim()
  if (!trimmed) return null

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed
}

const getEndOfDay = (date: Date) => {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999
  )
}

const getDeadlineEndOfDay = (deadline?: string | Date | null) => {
  if (!deadline) return null

  if (deadline instanceof Date) {
    return parseDate(deadline) ? getEndOfDay(deadline) : null
  }

  const value = deadline.toString().trim()
  if (!value) return null

  const dateOnlyMatch = value.match(dateOnlyPattern)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999)
  }

  const parsed = parseDate(value)
  if (!parsed) return null

  return getEndOfDay(parsed)
}

const getNoDeadlineCutoff = (job?: DeadlineJob | null) => {
  const createdAt = parseDate(job?.created_at || job?.createdAt)
  if (!createdAt) return null

  return new Date(createdAt.getTime() + noDeadlineCutoffDays * millisecondsPerDay)
}

export const isJobExpired = (job?: DeadlineJob | null, now = new Date()) => {
  const deadlineEnd = getDeadlineEndOfDay(job?.deadline)
  if (deadlineEnd) {
    return now.getTime() > deadlineEnd.getTime()
  }

  const noDeadlineCutoff = getNoDeadlineCutoff(job)
  if (!noDeadlineCutoff) return false

  return now.getTime() > noDeadlineCutoff.getTime()
}
