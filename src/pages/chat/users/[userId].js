
export async function getServerSideProps({ req, params: { userId } }) {
    const { Conversation } = req.app.get('dbContext');
    let conversation = await Conversation.findOne({
        userIds: [req.user, userId].sort(),
        creatorId: null
    }, { _id: 1 }).lean();
    if (!conversation) {
        conversation = await Conversation.create({ userIds: [req.user, userId].sort() });
    }
    return {
        redirect: {
            destination: `/chat/conversations/${conversation._id}`,
            permanent: false
        }
    };
}

export default function () { };