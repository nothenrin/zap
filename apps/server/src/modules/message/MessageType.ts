import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import MessageModel, { MessageDefinition } from "./MessageModel";
import { connectionDefinitions } from "graphql-relay";
import { UserType } from "../user/UserType";
import { RoomType } from "../room/RoomType";
import { RoomDefinition } from "../room/RoomModel";

export const MessageType = new GraphQLObjectType<MessageDefinition>({
  name: 'Message',
  fields: () => ({
    id: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (message) => message._id,
    },
    content: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (message) => message.content,
    },
    sender: {
      type: new GraphQLNonNull(UserType),
      resolve: (message) => message.sender,
    },
    room: {
      type: new GraphQLNonNull(RoomType),
      resolve: async message => {
        const messageModel = await MessageModel
          .findById(message._id)
          .populate<{ room: RoomDefinition }>('room')
          .exec();

        return messageModel?.room;
      }
    },
    sentAt: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: (message) => message.createdAt.toString(),
    }
  })
})

export const MessageConnection = connectionDefinitions({
  name: 'Message',
  nodeType: MessageType
})

export default MessageType;
