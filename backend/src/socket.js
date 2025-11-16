// --- backend/src/socket.js ---
import prisma from './client.js';

// Helper to check if both parties have confirmed resolution
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
        console.log(`User connected: ${socket.id}`);

        // 1. CHAT & ROOM MANAGEMENT
        socket.on('join_room', (requestId) => {
            socket.join(String(requestId)); 
            console.log(`User ${socket.id} joined room ${requestId}`);
        });

        socket.on('send_message', (data) => {
            socket.to(String(data.roomId)).emit('receive_message', data);
        });
        
        // 2. CONFLICT HANDLING
        socket.on('raise_conflict', async (data) => {
            console.warn(`🚨 CONFLICT RAISED: ${data.requestId} by ${data.reporterRole}`);
            const requestId = parseInt(data.requestId);
            
            // PRISMA ACTION 1: Flag status in DB for Admin Review
            await prisma.request.update({
                where: { id: requestId },
                data: { status: 'Conflict' },
            });

            // SOCKET ACTION 1: Notify Admin Dashboard
            io.to('admin_room').emit('new_conflict_alert', {
                requestId: requestId,
                reason: data.reason,
                reporter: data.reporterRole,
            });
            
            // SOCKET ACTION 2: Notify Room 
            const systemMessage = {
                roomId: String(requestId),
                sender: 'System',
                text: `⚠️ Conflict raised by ${data.reporterRole}. An administrator has been notified.`,
                timestamp: new Date().toLocaleTimeString()
            };
            io.to(String(requestId)).emit('receive_message', systemMessage);
        });

        // 3. MUTUAL SOLVED CONFIRMATION
        socket.on('mark_solved', async (data) => {
            const { requestId, reporterRole } = data;
            const id = parseInt(requestId);
            
            // PRISMA ACTION 1: Set one party's solved flag
            const flagField = reporterRole === 'Victim' ? 'isResolvedByVictim' : 'isResolvedByVolunteer';
            await prisma.request.update({
                where: { id: id },
                data: { [flagField]: true },
            });
            
            // Check for mutual resolution
            if (await checkMutualResolution(id)) {
                await prisma.request.update({ where: { id: id }, data: { status: 'Completed' } });
                
                // SOCKET ACTION 1: Notify both parties
                io.to(String(id)).emit('system_notification', {
                    status: 'COMPLETED', 
                    text: "🎉 Request successfully closed by mutual agreement. Thank you!",
                    requestId: id 
                });
                
            } else {
                // Notify the other party they need to confirm
                const requiredRole = reporterRole === 'Victim' ? 'Volunteer' : 'Victim';
                const notificationMessage = `${reporterRole} marked the request as SOLVED. Waiting for ${requiredRole} confirmation to finalize.`;
                
                io.to(String(id)).emit('system_notification', {
                    status: 'PENDING_CONFIRMATION',
                    text: notificationMessage
                });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected', socket.id);
        });
    });
};