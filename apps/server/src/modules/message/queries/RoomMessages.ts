import { GraphQLFieldConfig, GraphQLID, GraphQLNonNull } from "graphql";
import { GraphQLContext } from "../../../schemas/context";
import { MessageConnection } from "../MessageType";
import { ConnectionArguments, connectionArgs } from "graphql-relay";
import DataLoader from "dataloader";
import { connectionFromMongoCursor, mongooseLoader } from "@entria/graphql-mongoose-loader";
import MessageModel from "../MessageModel";

export const RoomMessages: GraphQLFieldConfig<any, GraphQLContext, ConnectionArguments & {
  roomId: string
}> = {
  type: new GraphQLNonNull(MessageConnection.connectionType),
  description: "List room messages",
  args: {
    ...connectionArgs,
    roomId: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The messages' room id"
    }
  },
  resolve: async (_src, args, context) => {
    const loader = new DataLoader<string, Promise<any>>(ids => {
      return mongooseLoader(MessageModel, ids);
    });

    return connectionFromMongoCursor({
      cursor: MessageModel.find({ room: args.roomId }),
      context,
      args,
      loader: (_ctx, id) => loader.load(id.toString()),
    })
  }
}
