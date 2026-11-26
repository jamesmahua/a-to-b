import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { clearFinishedJob, markOrderCollected, markOrderDelivered, setDriverOnline, useAuth } from '@repo/firebase'
import { AppText, Card, Notice, Screen, Stack, theme } from '@repo/ui'
import { ConfirmSheet } from '../../components/ConfirmSheet'
import { DriverHeader } from '../../components/DriverHeader'
import { JobCard } from '../../components/JobCard'
import { OnlineCard } from '../../components/OnlineCard'
import { useMyDriver, useMyOrders } from '../../lib/hooks'
import {
  approvalGate,
  driverActionError,
  endedJobNotice,
  itemCountText,
  itemLines,
  jobStage,
  onlineControl,
  pickActiveJob,
  shouldClearFinishedJob,
  type JobNotice,
} from '../../lib/jobs'

type Confirming = { kind: 'collect' | 'deliver'; orderId: string } | null

/**
 * The driver's home screen (/driver in the browser): online/offline, the job
 * they've been given, collect, deliver. Two live listeners: the driver's own doc
 * and the orders assigned to them. Dispatch is manual in v1 (spec §9), so a job
 * appears here when a super admin assigns it.
 */
export default function DriverHome() {
  const { user, profile } = useAuth()
  const uid = user?.uid ?? ''
  const { driver, error: driverError } = useMyDriver(uid)
  const { orders, error: ordersError } = useMyOrders(uid)

  const job = orders ? pickActiveJob(orders, driver?.activeOrderId ?? null) : null

  // ── What happened to the last job (delivered, cancelled, given to someone else) ──
  const [notice, setNotice] = useState<JobNotice | null>(null)
  const previousJob = useRef<{ id: string; code: string } | null>(null)
  const deliveredHere = useRef<string | null>(null)
  useEffect(() => {
    if (!orders) return
    const ended = endedJobNotice(previousJob.current, job?.id ?? null, orders, deliveredHere.current)
    if (ended) setNotice(ended)
    else if (job && job.id !== previousJob.current?.id) setNotice(null) // a new job replaces old news
    previousJob.current = job ? { id: job.id, code: job.code } : null
  }, [orders, job])

  // ── Tidy the driver doc when a job ended without them (spec §10.2) ──
  const clearedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!driver || !orders || !shouldClearFinishedJob(driver, orders)) return
    if (clearedFor.current === driver.activeOrderId) return // already asked; wait for the doc to update
    clearedFor.current = driver.activeOrderId
    clearFinishedJob(uid).catch(() => {
      clearedFor.current = null // try again on the next update
    })
  }, [driver, orders, uid])

  // ── Online / offline ──
  const [toggling, setToggling] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const control = driver ? onlineControl(driver, !!job) : null
  const toggleOnline = async () => {
    if (!control) return
    setToggling(true)
    setToggleError(null)
    try {
      await setDriverOnline(uid, !control.online)
    } catch {
      setToggleError('We couldn’t change your status. Check your connection and try again.')
    } finally {
      setToggling(false)
    }
  }

  // ── Collect / deliver (each behind a confirm sheet) ──
  const [confirming, setConfirming] = useState<Confirming>(null)
  const [acting, setActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const openConfirm = (kind: 'collect' | 'deliver') => {
    if (!job) return
    setActionError(null)
    setConfirming({ kind, orderId: job.id })
  }
  // The sheet always acts on the live job. If the job changes stage or goes away
  // while it's open (e.g. cancelled), close it.
  const confirmStillValid =
    !!confirming &&
    !!job &&
    confirming.orderId === job.id &&
    jobStage(job.status) === (confirming.kind === 'collect' ? 'collect' : 'deliver')
  useEffect(() => {
    if (confirming && orders && !confirmStillValid && !acting) setConfirming(null)
  }, [confirming, orders, confirmStillValid, acting])

  const runConfirmed = async () => {
    if (!job || !confirming) return
    setActing(true)
    setActionError(null)
    try {
      if (confirming.kind === 'collect') {
        await markOrderCollected(job)
      } else {
        deliveredHere.current = job.id
        await markOrderDelivered(job, uid)
      }
      setConfirming(null)
    } catch (err) {
      if (confirming.kind === 'deliver') deliveredHere.current = null
      setActionError(driverActionError(err))
    } finally {
      setActing(false)
    }
  }

  // ── Render ──
  const name = driver?.displayName ?? profile?.displayName ?? 'Driver'
  const loadError = driverError ?? ordersError
  const gate = driver === undefined ? null : approvalGate(driver)
  const summary = job ? `On a job · ${job.code}` : control ? (control.online ? 'Online' : 'Offline') : undefined

  return (
    <View style={{ flex: 1 }}>
      <DriverHeader name={name} summary={summary} />
      <Screen>
        {loadError ? <Notice tone="danger">{loadError}</Notice> : null}

        {driver === undefined && !loadError ? <ActivityIndicator color={theme.color.textStrong} /> : null}

        {gate ? (
          <Card>
            <AppText variant="heading">{gate.title}</AppText>
            <AppText>{gate.body}</AppText>
          </Card>
        ) : null}

        {driver && !gate ? (
          <Stack gap={5}>
            {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

            {control ? <OnlineCard control={control} busy={toggling} error={toggleError} onToggle={toggleOnline} /> : null}

            {!orders && !ordersError ? <ActivityIndicator color={theme.color.textStrong} /> : null}

            {job ? (
              <JobCard order={job} onCollect={() => openConfirm('collect')} onDeliver={() => openConfirm('deliver')} />
            ) : orders && control?.online ? (
              <Card>
                <AppText variant="heading">Waiting for a job</AppText>
                <AppText variant="small">When K&K gives you a delivery, it shows up here straight away.</AppText>
              </Card>
            ) : null}
          </Stack>
        ) : null}
      </Screen>

      {job ? (
        <>
          <ConfirmSheet
            visible={confirming?.kind === 'collect' && confirmStillValid}
            title={`Collected ${job.code}?`}
            confirmLabel="Yes, I’ve collected it"
            busy={acting}
            error={actionError}
            onConfirm={runConfirmed}
            onClose={() => setConfirming(null)}
          >
            <Stack gap={2}>
              <AppText>
                Check the bag from {job.storeName} has {itemCountText(job.itemCount)}:
              </AppText>
              {itemLines(job.items).map((line, i) => (
                <AppText key={i} variant="small">
                  {line}
                </AppText>
              ))}
            </Stack>
          </ConfirmSheet>

          <ConfirmSheet
            visible={confirming?.kind === 'deliver' && confirmStillValid}
            title={`Delivered to ${job.customerFirstName}?`}
            confirmLabel="Yes, delivered"
            busy={acting}
            error={actionError}
            onConfirm={runConfirmed}
            onClose={() => setConfirming(null)}
          >
            {`Only tap this once ${job.customerFirstName} has the order in hand. ${job.customerFirstName} sees it as delivered straight away.`}
          </ConfirmSheet>
        </>
      ) : null}
    </View>
  )
}
