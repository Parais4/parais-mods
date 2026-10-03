// Surface module: draws the figure from the runs the hooks module computed
// (quadrant blocks, two colors per cell) and turns clicks into posts.
// A double click on the head posts { type: 'ack' } ("oké, értettem"), a click
// on the body posts { type: 'pet' }. In the skin picker (`pick` set) any click
// posts { type: 'pick', skin }. Runs on the surface, so no `$` here.

import type { ClientModule } from 'claude-code'

type Run = { text: string; fg?: string; bg?: string }
type Props = { lines: Run[][]; pick?: string }

const DOUBLE_CLICK_MS = 450
// Cell rows 0-3 and columns 0-10 hold the head; below it is the body.
const HEAD_ROWS = 4
const HEAD_COLUMNS = 11

let lastHeadDown = 0

const Dog: ClientModule<Props> = (props, surface) => {
  const { Box, Text } = surface.elements

  surface.onPointer(e => {
    if (e.type !== 'down' || e.button !== 'left') return
    if (props.pick !== undefined) {
      surface.post({ type: 'pick', skin: props.pick })
      return
    }
    if (e.y < HEAD_ROWS && e.x < HEAD_COLUMNS) {
      const now = Date.now()
      if (now - lastHeadDown <= DOUBLE_CLICK_MS) {
        lastHeadDown = 0
        surface.post({ type: 'ack' })
      } else {
        lastHeadDown = now
      }
      return
    }
    surface.post({ type: 'pet' })
  })

  return (
    <Box flexDirection="column">
      {props.lines.map((runs, y) => (
        <Box key={`r${y}`} flexDirection="row">
          {runs.map((run, i) => (
            <Text key={`c${y}-${i}`} color={run.fg} backgroundColor={run.bg}>
              {run.text}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  )
}

export default Dog
