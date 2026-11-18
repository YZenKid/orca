import { mkdtemp, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { acpLaunchSpecFor } from '../launch/acp-launch-registry'
import { closeProviderTimelineRigs } from '../../native-chat/agent-session-timeline/provider-timeline-assembler-test-support'
import { openAcpAdapterRig, waitFor } from './testing/acp-structured-adapter.test-support'

afterEach(async () => {
  await closeProviderTimelineRigs()
})

describe('the MCP servers an OMP chat starts with', () => {
  it('sends the servers its profile mcp.json defines in session/new, not an empty list', async () => {
    const root = await mkdtemp(join(tmpdir(), 'acp-session-mcp-'))
    const profile = join(root, 'profile')
    await mkdir(profile, { recursive: true })
    await writeFile(
      join(profile, 'mcp.json'),
      JSON.stringify({
        mcpServers: { kaneo: { type: 'http', url: 'https://kaneo.test/mcp' } }
      }),
      'utf8'
    )
    const spec = acpLaunchSpecFor('omp')!
    const rig = await openAcpAdapterRig({
      spec,
      launch: { cwd: join(root, 'project'), env: { PI_CODING_AGENT_DIR: profile } }
    })
    await rig.acquire()
    const request = await rig.frame('session/new')
    await waitFor(() => expect(rig.started()).toBeDefined())
    expect(request.params).toMatchObject({
      mcpServers: [{ type: 'http', name: 'kaneo', url: 'https://kaneo.test/mcp', headers: [] }]
    })
  })
})
