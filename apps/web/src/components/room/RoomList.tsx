import { graphql, useFragment } from "react-relay";
import { RoomPreview } from "./RoomPreview";
import NoMessages from "../emptyState/NoMessages";
import { extractNodes } from "@/utils";
import { Pen } from "lucide-react";
import { useState } from "react";
import { animated, useTransition } from "@react-spring/web";
import { Search } from "../Search";
import { NewRoom } from "./NewRoom";
import { RoomListQuery$key } from "@/__generated__/RoomListQuery.graphql";
import { RoomListFragment$key } from "@/__generated__/RoomListFragment.graphql";

const roomListFragment = graphql`
  fragment RoomListFragment on RoomConnection {
    edges {
      node {
        id
        ...RoomPreviewFragment
      }
    }
  }
`;

const roomListQuery = graphql`
  fragment RoomListQuery on Query {
    rooms {
      ...RoomListFragment
    }
    ...NewRoomQuery
  }
`;

const EmptyState = () => {
  return (
    <div className="w-full px-4 flex items-center h-full justify-center flex-col">
      <NoMessages />
      <p className="text-lg font-semibold">No Messages</p>
      <p className="text-zinc-600">You have no active chats</p>
    </div>
  );
};

export const RoomPreviewList = ({
  fragmentRef,
}: {
  fragmentRef: RoomListQuery$key;
}) => {
  const { rooms: roomsKey, ...users } = useFragment(
    roomListQuery,
    fragmentRef,
  );

  const roomsFragment: RoomListFragment$key = roomsKey;
  const data = useFragment(roomListFragment, roomsFragment);
  const rooms = extractNodes(data);

  const [showNewRoom, setShowNewRoom] = useState(false);
  const transitions = useTransition(showNewRoom, {
    from: { y: 200 },
    enter: { y: 0 },
    leave: { y: 200 },
    config: { tension: 200 },
  });

  return (
    <section
      onMouseOver={() => setShowNewRoom(true)}
      onMouseOut={() => setShowNewRoom(false)}
      className="relative min-w-64 max-w-[100vw] lg:max-w-md lg:w-[33vw] xl:w-[25vw] bg-white shadow py-2.5 flex flex-col gap-2 h-screen z-10"
    >
      <div className="px-3">
        <Search />
      </div>
      {rooms.length > 0 ? (
        <div className="h-full max-h-full flex flex-col overflow-y-auto px-3">
          {rooms.map((room) => {
            return <RoomPreview key={room.id} roomFragmentKey={room} />;
          })}
        </div>
      ) : (
        <EmptyState />
      )}
      {data?.edges && (
        <div className="absolute bottom-0 right-0 overflow-hidden">
          {transitions((style, isOpen) =>
            isOpen ? (
              <NewRoom fragmentKey={users}>
                <animated.div style={style}>
                  <span className="bg-secondary-400 text-white aspect-square p-4 mb-8 mr-8 rounded-full shadow inline-block">
                    <Pen size={24} fill="white" />
                  </span>
                </animated.div>
              </NewRoom>
            ) : null,
          )}
        </div>
      )}
    </section>
  );
};
