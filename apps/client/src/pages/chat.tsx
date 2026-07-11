import { useEffect, useRef } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';



import Layout from '@/src/layout/index';

import { ChatBox } from '@/components/chat-box';

import { ProjectWorkspaceSidebar } from '@/components/project-workspace-sidebar';

import { cn } from '@/lib/utils';

import { useProjectChat } from '@/hooks/use-project-chat';



type ChatLocationState = {

  pendingMessage?: string;

};



export default function ChatPage() {

  const { projectId } = useParams<{ projectId: string }>();

  const location = useLocation();

  const navigate = useNavigate();

  const pendingMessage = (location.state as ChatLocationState | null)

    ?.pendingMessage;



  const {

    messages,

    loading,

    sending,

    statusText,

    error,

    previewUrl,

    filesRefreshKey,

    loadChat,

    sendMessage,

    cancelStream,

  } = useProjectChat(projectId);



  const pendingSentRef = useRef(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);



  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  }, [messages, statusText]);



  useEffect(() => {

    if (!projectId) {

      navigate('/dashboard', { replace: true });

      return;

    }



    void loadChat();

  }, [projectId, loadChat, navigate]);



  useEffect(() => {

    if (

      !projectId ||

      !pendingMessage ||

      pendingSentRef.current ||

      loading ||

      sending

    ) {

      return;

    }



    pendingSentRef.current = true;

    navigate(`/chat/${projectId}`, { replace: true, state: {} });

    void sendMessage(pendingMessage);

  }, [

    projectId,

    pendingMessage,

    loading,

    sending,

    navigate,

    sendMessage,

  ]);



  useEffect(() => {

    return () => {

      cancelStream();

    };

  }, [cancelStream]);



  return (

    <Layout>

      <div className="flex h-svh min-h-0 w-full flex-col bg-[var(--sidebar))] p-3 pb-0 lg:flex-row">

        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-t-[20px] bg-cover bg-center">

          <div className="pointer-events-none absolute inset-0 bg-black/10" />



          <div className="relative z-10 flex min-h-0 flex-1 flex-col">

            <div className="flex-1 space-y-6 overflow-y-auto px-4 py-8 sm:px-8">

              {loading ? (

                <div className="flex h-full items-center justify-center">

                  <p className="text-sm text-muted-foreground">

                    Loading chat...

                  </p>

                </div>

              ) : messages.length === 0 && !statusText ? (

                <div className="flex h-full items-center justify-center">

                  <p className="text-sm text-muted-foreground">

                    Start a conversation below

                  </p>

                </div>

              ) : (

                <>

                  {messages.map((message) => (

                    <div

                      key={message.id}

                      className={cn(

                        'flex',

                        message.role === 'user'

                          ? 'justify-end'

                          : 'justify-start',

                      )}

                    >

                      <div

                        className={cn(

                          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[70%]',

                          message.role === 'user'

                            ? 'bg-foreground text-background'

                            : 'border border-border/60 bg-card/90 text-foreground backdrop-blur',

                        )}

                      >

                        {message.content}

                      </div>

                    </div>

                  ))}



                  {statusText ? (

                    <div className="flex justify-start">

                      <div className="max-w-[85%] rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm text-muted-foreground backdrop-blur sm:max-w-[70%]">

                        {statusText}

                      </div>

                    </div>

                  ) : null}



                  {sending && !statusText ? (

                    <div className="flex justify-start">

                      <div className="rounded-2xl border border-border/60 bg-card/90 px-4 py-3 text-sm text-muted-foreground backdrop-blur">

                        Thinking...

                      </div>

                    </div>

                  ) : null}

                </>

              )}



              {error ? (

                <p className="text-center text-sm text-destructive">{error}</p>

              ) : null}



              <div ref={messagesEndRef} />

            </div>



            <div className="border-t border-white/10 bg-background/40 p-4 backdrop-blur-md">

              <div className="mx-auto w-full max-w-3xl">

                <ChatBox

                  placeholder="Ask LightX to update your project..."

                  disabled={loading || sending}

                  onSubmit={(content) => {

                    void sendMessage(content);

                  }}

                />

              </div>

            </div>

          </div>

        </div>



        <div className="mt-3 min-h-[45vh] shrink-0 overflow-hidden rounded-t-[20px] lg:mt-0 lg:ml-3 lg:min-h-0 lg:h-full">

          <ProjectWorkspaceSidebar

            projectId={projectId}

            previewUrl={previewUrl}

            filesRefreshKey={filesRefreshKey}

          />

        </div>

      </div>

    </Layout>

  );

}

