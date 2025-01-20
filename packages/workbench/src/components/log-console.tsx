import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useLogs } from '@/stores/use-logs'
import { motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LogLevelBadge } from './log-level-badge'
import { Button } from './ui/button'

const timestamp = (time: number) => {
  const date = new Date(Number(time))
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

export const LogConsole = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const logs = useLogs((state) => state.logs)
  const resetLogs = useLogs((state) => state.resetLogs)
  const toggleExpand = () => setIsExpanded((prev) => !prev)

  return (
    <div className="absolute bottom-0 left-0 right-0 w-full bg-black h-fit z-40">
      <div className="flex justify-between w-full items-center p-2">
        <label className="text-green-500 w-full text-left justify-start h-full text-lg font-bold">Logs</label>
        {logs.length > 0 && (
          <Button variant="link" onClick={resetLogs} className="text-green-500">
            <Trash2 className="w-4 h-4 text-green-500" />
            Clear logs
          </Button>
        )}
        <Button variant="link" onClick={toggleExpand} className="text-green-500">
          {isExpanded && <ChevronDown className="w-4 h-4 text-green-500" />}
          {!isExpanded && <ChevronUp className="w-4 h-4 text-green-500" />}
        </Button>
      </div>
      {isExpanded && <div className="divide-solid divide-green-500 divide-y" />}
      <Collapsible open={isExpanded} className={`w-full`}>
        <CollapsibleContent>
          <motion.div
            className="overflow-y-auto h-[25vh] flex flex-col gap-2 py-2"
            initial={{ height: 0 }}
            animate={{ height: '25vh' }}
            transition={{ duration: 0.3 }}
          >
            <Table>
              <TableHeader className="sticky top-0 bg-black">
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Trace</TableHead>
                  <TableHead>Flow</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>File</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-md font-mono font-bold">
                {logs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-green-500">{timestamp(log.time)}</TableCell>
                    <TableCell>
                      <LogLevelBadge level={log.level} />
                    </TableCell>
                    <TableCell>{log.traceId.split('-').pop()}</TableCell>
                    <TableCell>{log.flows?.join?.(', ')}</TableCell>
                    <TableCell>{log.msg}</TableCell>
                    <TableCell>{log.file}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </motion.div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
