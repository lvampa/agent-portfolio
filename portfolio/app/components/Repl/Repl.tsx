import { History } from "@app/components/History";
import { HISTORY_ITEM_TYPES,type HistoryItem } from "@app/components/History";
import { InputForm } from "@app/components/Repl/InputForm";
import { EVENTS } from "@app/constants/events";
import { useAnimation } from "@app/contexts/AnimationContext";
import { useEventBus } from "@app/contexts/EventBusContext";
import useChat from "@lib/hooks/useChat";
import { useEffect } from "react";

import ReplLoading from "@/app/components/Repl/ReplLoading";

export default function Repl() {
  const eventBus = useEventBus();
  const { isLoading, sendMessage } = useChat();
  const { isAnimating } = useAnimation();

  useEffect(() => {
    function executeReplCommand(data: HistoryItem) {
      if (data?.value) {
        sendMessage(data.value).then((result) => {
          if (Array.isArray(result)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result.forEach((item: any) => {
              const itemData: HistoryItem = {
                value: item?.output ?? "",
                type: HISTORY_ITEM_TYPES.MESSAGE
              };
              eventBus.emit(EVENTS.CHAT_RESULT, itemData);
            });
          }
        });
      }
    }
    const unRegisterFn = eventBus.on(EVENTS.SUBMIT, executeReplCommand);
    return () => unRegisterFn();
  }, [sendMessage]);

  return (
    <div>
      <History />
      <ReplLoading
        isVisible={ isLoading }
      />
      <InputForm
        isVisible={!isLoading && !isAnimating}
      />
    </div>
  );
}
