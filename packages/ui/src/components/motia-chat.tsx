import React from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { MessageSquare, Loader2 } from 'lucide-react'

type Message = {
  id: string
  content: string
  role: 'user' | 'assistant' | 'error'
  timestamp: Date
}

type FlowState = {
  currentPhase: string | null
  error: string | null
  needsClarification: boolean
  clarificationQuestions: string[]
  finalPlan: any
}

export function MotiaChat() {
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const pollingRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Cleanup polling on unmount
  React.useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  async function pollForFlowStatus(messageId: string) {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
    }

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/status?messageId=${messageId}`)
        if (!res.ok) {
          throw new Error(`Status check failed: ${res.status}`)
        }

        const data: FlowState = await res.json()
        console.log('Status update:', data)

        // Handle error
        if (data.error) {
          addMessage({
            id: crypto.randomUUID(),
            content: `Error: ${data.error}`,
            role: 'error',
            timestamp: new Date(),
          })
          setIsLoading(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
          return
        }

        // Handle clarification needed
        if (data.needsClarification) {
          const questions = data.clarificationQuestions.join('\n- ')
          addMessage({
            id: crypto.randomUUID(),
            content: `I need some clarification:\n- ${questions}`,
            role: 'assistant',
            timestamp: new Date(),
          })
          setIsLoading(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
          return
        }

        // Handle final plan
        if (data.finalPlan) {
          addMessage({
            id: crypto.randomUUID(),
            content: `I've designed your flow! Here's the plan:\n\`\`\`json\n${JSON.stringify(data.finalPlan, null, 2)}\n\`\`\``,
            role: 'assistant',
            timestamp: new Date(),
          })
          setIsLoading(false)
          if (pollingRef.current) clearInterval(pollingRef.current)
        }

        // Handle still processing
        if (data.currentPhase && !data.finalPlan && !data.needsClarification) {
          // Continue polling
          console.log('Still processing:', data.currentPhase)
        }
      } catch (err) {
        console.error('Polling error:', err)
        addMessage({
          id: crypto.randomUUID(),
          content: err instanceof Error ? err.message : 'Error checking flow status',
          role: 'error',
          timestamp: new Date(),
        })
        setIsLoading(false)
        if (pollingRef.current) clearInterval(pollingRef.current)
      }
    }, 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const messageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    addMessage({
      id: messageId,
      content: input,
      role: 'user',
      timestamp: new Date(),
    })

    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, messageId, timestamp }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      pollForFlowStatus(messageId)
    } catch (err) {
      addMessage({
        id: crypto.randomUUID(),
        content: err instanceof Error ? err.message : 'Error sending message',
        role: 'error',
        timestamp: new Date(),
      })
      setIsLoading(false)
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed bottom-20 right-4 h-12 w-12 rounded-full shadow-lg z-50">
          <MessageSquare className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full max-w-2xl p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Flow Builder Assistant</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : message.role === 'error'
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-muted'
                    }`}
                  >
                    <pre className="whitespace-pre-wrap font-mono text-sm">{message.content}</pre>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="border-t p-4 space-y-4">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the flow you want to build..."
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <Button type="submit" className="w-full" disabled={isLoading || !input.trim()}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? 'Processing...' : 'Send'}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
