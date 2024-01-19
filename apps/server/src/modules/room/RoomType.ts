import { GraphQLNonNull, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLNullableType } from "graphql/type";
import { connectionDefinitions } from "graphql-relay";

import { RoomDefinition, RoomModel } from "./RoomModel";
import { UserType } from "../user/UserType";
import MessageType from "../message/MessageType";
import { MessageModel, MessageDefinition } from "../message/MessageModel";

const list = <T extends GraphQLNullableType>(type: T) => {
  return new GraphQLNonNull(new GraphQLList( new GraphQLNonNull(type)))
}

export const RoomType: GraphQLObjectType<RoomDefinition, any> = new GraphQLObjectType<RoomDefinition>({
  name: "Room",
  description: "Room Type",
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (room) => room._id.toString()
    },
    participants: {
      type: list(UserType),
      resolve: (room) => room.participants
    },
    createdAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (room) => room.createdAt.toString(),
    },
    lastMessage: {
      type: MessageType,
      resolve: async (room) => {        
        const roomModel = await RoomModel
          .findById(room._id)
          .populate<{ lastMessage: MessageDefinition}>('lastMessage')
          .exec();

        return roomModel?.lastMessage
      }
    },
    updatedAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (room) => room.updatedAt.toString(),
    }
  })
})

export const RoomConnection = connectionDefinitions({
  name: "Room",
  nodeType: RoomType
});
