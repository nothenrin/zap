"use client";

import { SendHorizonal } from "lucide-react";
import { Avatar } from "..";
import { useForm } from "react-hook-form";
import {
  graphql,
  useFragment,
  useMutation,
  usePaginationFragment,
  useSubscription,
} from "react-relay";
import {
  RoomMessagesStoreMessageMutation as StoreMessage,
  RoomMessagesStoreMessageMutation$variables as StoreMessageVariables,
} from "@/__generated__/RoomMessagesStoreMessageMutation.graphql";
import { cn } from "@/utils/cn";
import { useMemo, useState } from "react";
import {
  RoomMessagesMessageAddedSubscription as MessageAdded,
  RoomMessagesMessageAddedSubscription$variables as MessageAddedVariables,
} from "@/__generated__/RoomMessagesMessageAddedSubscription.graphql";
import { GraphQLSubscriptionConfig } from "relay-runtime";
import {
  RoomMessagesMessageFragment$data,
  RoomMessagesMessageFragment$key,
} from "@/__generated__/RoomMessagesMessageFragment.graphql";
import { useUser } from "@/hooks/useUser";
import {
  RoomMessagesQuery$data,
  RoomMessagesQuery$key,
} from "@/__generated__/RoomMessagesQuery.graphql";
import { RoomMessagesPaginationQuery } from "@/__generated__/RoomMessagesPaginationQuery.graphql";

const messageAddedSubscription = graphql`
  subscription RoomMessagesMessageAddedSubscription(
    $input: MessageAddedInput!
  ) {
    messageAddedSubscribe(input: $input) {
      message {
        id
        content
      }
    }
  }
`;

const useMessageAddedSubscription = (variables: MessageAddedVariables) => {
  const config = useMemo<GraphQLSubscriptionConfig<MessageAdded>>(
    () => ({
      subscription: messageAddedSubscription,
      variables,
    }),
    [variables],
  );

  return useSubscription(config);
};

export const MessagesHeader = () => {
  return (
    <div className="flex items-center bg-white shadow px-6 py-2 gap-2">
      <Avatar />
      <div className="flex flex-col">
        <span className="text-lg font-semibold leading-tight">username</span>
        <p className="text-sm text-zinc-600 font-medium">
          Last seen yesterday at 17:32
        </p>
      </div>
    </div>
  );
};

const storeMessageMutation = graphql`
  mutation RoomMessagesStoreMessageMutation($input: StoreMessageInput!) {
    storeMessage(input: $input) {
      message {
        id
        content
      }
    }
  }
`;

const MessageFragment = graphql`
  fragment RoomMessagesMessageFragment on Message {
    id
    content
    sender {
      id
      username
    }
    sentAt
  }
`;

function groupByUser({ roomMessages: messages }: RoomMessagesQuery$data) {
  const groups = [];
  let currentGroup: RoomMessagesMessageFragment$data[] = [];

  if (!messages.edges) return [];

  for (const edge of messages.edges) {
    const lastMessage = currentGroup[currentGroup.length - 1];

    // Check if the current group is empty or if the user_id matches the user_id of
    // the last message in the current group.
    const messageNode = edge?.node;
    if (!messageNode) continue;
    const messageRef: RoomMessagesMessageFragment$key = messageNode;

    // TODO: is it bad for performance to call useFragment on each message?
    const message = useFragment(MessageFragment, messageRef);

    // Split into a new group so each message sender has it own group
    if (lastMessage?.sender.id !== message.sender.id) {
      groups.push(currentGroup);
      currentGroup = [message];
      continue;
    }

    // Split into a new group if the time difference from the last messsage
    // exceeds 5 minutes
    const MAX_TIME_DIFF = 5 * 60000;
    const lastMessageTime = new Date(lastMessage.sentAt).getTime();
    const currentMessageTime = new Date(message.sentAt).getTime();
    if (currentMessageTime - lastMessageTime > MAX_TIME_DIFF) {
      groups.push(currentGroup);
      currentGroup = [message];
      continue;
    }

    currentGroup.push(message);
  }

  // Push the last group into the groups array
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}

const getLastMessage = (messages: RoomMessagesMessageFragment$data[]) => {
  const lastMessages = messages.slice(-1);
  if (lastMessages.length == 1) {
    return lastMessages[0];
  }

  return null;
};

const getSentAt = (message: RoomMessagesMessageFragment$data) => {
  const date = new Date(message.sentAt);

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(date);
};

const MessageChunk = ({
  messages,
  isSender,
}: {
  messages: string[];
  isSender: boolean;
}) => {
  return (
    <div
      className={cn("w-full flex", isSender ? "justify-end" : "justify-start")}
    >
      <div className="flex flex-col gap-1 w-2/3">
        {messages.map((message, id) => {
          const isLastMessage = id + 1 === messages.length;
          const isFirstMessage = id == 0;

          return (
            <div
              key={id}
              className={cn("w-full flex flex-col", {
                "items-end rounded-l-full": isSender,
                "items-start rounded-r-full": !isSender,
              })}
            >
              <div className="rounded-tr-lg"></div>
              <div className="relative">
                <p
                  className={cn(
                    "px-3 py-1.5 bg-zinc-700 break-words max-w-full rounded-tl-3xl rounded-tr-3xl shadow",
                    {
                      "bg-zinc-200": !isSender,
                      "text-stone-800 bg-secondary-300": isSender,
                      "rounded-l-3xl rounded-tr-3xl rounded-br-xl":
                        isFirstMessage,
                      "rounded-bl-3xl rounded-tr-xl rounded-br-0":
                        isLastMessage && isSender,
                      "rounded-br-3xl rounded-tl-xl rounded-bl-0":
                        isLastMessage && !isSender,
                      "rounded-l-3xl rounded-r-xl":
                        !isLastMessage && !isFirstMessage,
                    },
                  )}
                >
                  {message}
                </p>
                {isLastMessage && (
                  <svg
                    height={17}
                    width={7}
                    className={cn("absolute bottom-0", {
                      "fill-secondary-300 left-full": isSender,
                      "fill-zinc-200 right-full": !isSender,
                    })}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 7 17"
                  >
                    <path
                      d="M6 17H0V0c.193 2.84.876 5.767 2.05 8.782.904 2.325 2.446 4.485 4.625 6.48A1 1 0 016 17z"
                      fill="inherit"
                    />
                  </svg>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PendingMessages = ({ messages }: { messages: string[] }) => {
  if (!messages.length) return;

  return (
    <div>
      <MessageChunk messages={messages} isSender={true} />
      <span className="text-zinc-400 text-sm flex justify-end mt-1">
        Sending...
      </span>
    </div>
  );
};

const Messages = ({ queryRef }: { queryRef: RoomMessagesQuery$key }) => {
  const { data, loadNext, isLoadingNext } = usePaginationFragment<RoomMessagesPaginationQuery, any>(
    graphql`
      fragment RoomMessagesQuery on Query
      @argumentDefinitions(
        roomId: { type: "ID!" }
        first: { type: "Int", defaultValue: 2 }
        after: { type: "String" }
      )
      @refetchable(queryName: "RoomMessagesPaginationQuery") {
        roomMessages(roomId: $roomId, first: $first, after: $after)
          @connection(key: "messages_roomMessages", filters: []) {
          edges {
            node {
              ...RoomMessagesMessageFragment
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `,
    queryRef,
  );

  const loadMore = () => {
    if (isLoadingNext) return;
    
    loadNext(15);
  }

  const user = useUser();
  const messageGroups = groupByUser(data);

  if (!user) return;

  return (
    <>
      {messageGroups.map((messageGroup, id) => {
        const isSender = messageGroup[0]?.sender.id == user.id;
        const isLastGroup = id + 1 === messageGroups.length;
        const lastMessage = getLastMessage(messageGroup);

        return (
          <div key={id}>
            <MessageChunk
              isSender={isSender}
              messages={messageGroup.map((message) => message.content)}
            />
            <div
              className={cn("flex gap-1.5 text-zinc-400", {
                "justify-end": isSender,
              })}
            >
              {isSender && isLastGroup && (
                <span className="text-sm mt-1">Sent</span>
              )}
              {lastMessage?.sentAt && (
                <span className="text-sm mt-1">{getSentAt(lastMessage)}</span>
              )}
            </div>
          </div>
        );
      })}
      <button
        className="text-white bg-red-500 rounded-xl text-xl px-3 py-1"
        onClick={loadMore}
      >
        Load More
      </button>
    </>
  );
};

export const RoomMessages = ({
  roomId,
  queryRef,
}: {
  roomId: string;
  queryRef: RoomMessagesQuery$key;
}) => {
  const [commitMutation] = useMutation<StoreMessage>(storeMessageMutation);
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);

  const { register, handleSubmit, setValue } = useForm<StoreMessageVariables>({
    defaultValues: {
      input: {
        roomId: roomId,
        content: "",
      },
    },
  });

  const sendMessage = (input: StoreMessageVariables) => {
    const content = input.input.content;
    if (!content) return;

    commitMutation({
      variables: input,
      onError: (err) => {
        console.error(err);
      },
    });

    setPendingMessages((messages) => [...messages, content]);
    setValue("input.content", "");
  };

  return (
    <form className="h-full w-full" onSubmit={handleSubmit(sendMessage)}>
      <div
        className="
          h-full max-h-full overflow-y-auto mx-auto max-w-3xl px-4 sm:px-6 lg:px-8
          container flex justify-end flex-col gap-y-1.5
        "
      >
        <Messages queryRef={queryRef} />
        <PendingMessages messages={pendingMessages} />

        <div className="w-full pt-2 pb-4 flex items-center gap-2.5">
          <input
            placeholder="Message"
            className="rounded-2xl shadow px-6 py-3.5 w-full tracking-wide outline-none"
            {...register("input.content")}
          />
          <button className="bg-white p-3.5 shadow rounded-full text-secondary-400 hover:bg-secondary-400 hover:text-white">
            <SendHorizonal />
          </button>
        </div>
      </div>
      <div
        style={{ mask: "url('/bg-tile.svg')" }}
        className="h-full w-full bg-secondary-500 absolute top-0 -z-10 opacity-30"
      />
    </form>
  );
};