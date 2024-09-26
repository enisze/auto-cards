import { Game, Match } from '@/db/schema-zod'
import { generateMatch } from '@/game/generateMatch'
import { cn } from '@/lib/utils'
import { createId } from '@paralleldrive/cuid2'
import { every } from 'lodash-es'
import { AlertCircle, Swords } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { MatchCards } from './MatchCards'
import { getMatchParticipants, MatchParticipant } from './MatchParticipants'
import { MatchReportPlaybackControls } from './MatchReportPlaybackControls'
import { MatchSide } from './MatchSide'

export const MatchView = async ({
  game,
  match,
  forceParticipants,
  calculateChangemakers = false,
}: {
  game?: Game
  match: Match
  forceParticipants?: MatchParticipant[]
  calculateChangemakers?: boolean
}) => {
  const participants =
    forceParticipants ?? (await getMatchParticipants({ matchId: match.id }))
  if (participants.length !== 2 || !every(participants, (p) => p.loadout)) {
    return (
      <>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Old Match</AlertTitle>
          <AlertDescription>
            Game has changed too much to replay this match
          </AlertDescription>
        </Alert>
        {/* {!!game && <NextRoundButton game={game} />} */}
      </>
    )
  }

  const logId = createId().substring(0, 4)
  console.time(`generateMatchByWorker ${match.id} ${logId}`)
  const [matchReport, changemakers] = await Promise.all([
    generateMatch({
      participants: participants.map((p) => ({ loadout: p.loadout.data })),
      seed: [match.data.seed],
    }),
    undefined,
  ])
  console.timeEnd(`generateMatchByWorker ${match.id} ${logId}`)

  // const themeIds = await Promise.all(
  //   participants.map((p) => fallbackThemeId(p.user?.themeId)),
  // )

  return (
    <>
      {/* <MatchBackground themeIds={themeIds} autoGenerate={true} /> */}
      <div
        className={cn(
          'flex-1 grid gap-4',
          'grid-cols-[1fr_1fr_!important]',
          'grid-rows-[auto_auto_1fr_!important]',
          "[grid-template:'middle_middle'_'stats_stats'_'left_right']",
          'xl:grid-cols-[auto_1fr_auto_!important]',
          'xl:grid-rows-[1fr_auto_auto_!important]',
          "xl:[grid-template:'left_middle_right'_'stats_stats_stats']",
        )}
      >
        <div
          style={{
            gridArea: 'left',
          }}
          className="flex flex-row gap-4 items-start xl:items-center justify-start"
        >
          <MatchCards
            items={participants[0].loadout.data.items}
            sideIdx={0}
            changemakers={changemakers}
            matchReport={matchReport}
            // themeId={themeIds[0]}
          />
        </div>
        <div
          style={{
            gridArea: 'right',
          }}
          className="flex flex-row gap-4 items-start xl:items-center justify-end"
        >
          <MatchCards
            items={participants[1].loadout.data.items}
            sideIdx={1}
            changemakers={changemakers}
            matchReport={matchReport}
            // themeId={themeIds[1]}
          />
        </div>
        <div
          className="flex-1 flex flex-col gap-2 items-center justify-center self-stretch"
          style={{
            gridArea: 'middle',
          }}
        >
          <MatchReportPlaybackControls matchReport={matchReport} />
          {/* <MatchReportTabs
            game={game}
            matchReport={matchReport}
            loadouts={participants.map((p) => p.loadout.data)}
            seed={match.data.seed}
          /> */}
          <div className="flex-1" />
          {/* {!!game && <NextRoundButton game={game} />} */}
        </div>
        <div
          style={{
            gridArea: 'stats',
          }}
        >
          <div className="flex flex-row gap-2 justify-center relative">
            <div className="max-xl:flex-1 flex flex-col gap-4">
              <MatchSide
                sideIdx={0}
                participant={participants[0]}
                matchReport={matchReport}
              />
            </div>
            <div className="absolute top-8 z-10">
              <Swords className="size-8 xl:size-16" />
            </div>
            <div className="max-xl:flex-1 flex flex-col gap-4">
              <MatchSide
                sideIdx={1}
                participant={participants[1]}
                matchReport={matchReport}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
