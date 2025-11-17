import prisma from './client.js';

const checkMutualResolution = async (requestId) => {
    const id = parseInt(requestId); 
    const request = await prisma.request.findUnique({
        where: { id: id },
        select: { isResolvedByVictim: true, isResolvedByVolunteer: true }
    });
    return request?.isResolvedByVictim && request?.isResolvedByVolunteer;
};


export const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {

        socket.on('join_room', (requestId) => {
            socket.join(String(requestId)); 
        });

        socket.on('send_message', (data) => {
            socket.to(String(data.roomId)).emit('receive_message', data);
        });
        
        socket.on('raise_conflict', async (data) => {
            const requestId = parseInt(data.requestId);
            
            await prisma.request.update({
                where: { id: requestId },
                data: { status: 'Conflict' },
            });

            io.to('admin_room').emit('new_conflict_alert', {
                requestId: requestId,
                reason: data.reason,
                reporter: data.reporterRole,
            });
            
            const systemMessage = {
                roomId: String(requestId),
                sender: 'System',
                text: `⚠️ Conflict raised by ${data.reporterRole}. An administrator has been notified and will intervene.`,
                timestamp: new Date().toLocaleTimeString()
            };
            io.to(String(requestId)).emit('receive_message', systemMessage);
        });

        socket.on('mark_solved', async (data) => {
            const { requestId, reporterRole } = data;
            const id = parseInt(requestId);
            
            const flagField = reporterRole === 'Victim' ? 'isResolvedByVictim' : 'isResolvedByVolunteer';
            await prisma.request.update({
                where: { id: id },
                data: { [flagField]: true },
            });
            
            if (await checkMutualResolution(id)) {
                await prisma.request.update({ where: { id: id }, data: { status: 'Completed' } });
                
                io.to(String(id)).emit('system_notification', {
                    status: 'COMPLETED', 
                    text: "🎉 Request successfully closed by mutual agreement. Thank you!",
                    requestId: id 
                });
                
            } else {
                const requiredRole = reporterRole === 'Victim' ? 'Volunteer' : 'Victim';
                const notificationMessage = `${reporterRole} marked the request as SOLVED. Waiting for ${requiredRole} confirmation to finalize.`;
                
                io.to(String(id)).emit('system_notification', {
                    status: 'PENDING_CONFIRMATION',
                    text: notificationMessage
                });
            }
        });

    });
};