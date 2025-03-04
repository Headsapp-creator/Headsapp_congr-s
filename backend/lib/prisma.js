import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

prisma.$use(async (params, next) => {
    const { model, action, args } = params;
  
    // Enforce integrity for User model on create or update actions
    if (model === 'User' && (action === 'create' || action === 'update')) {
      const userRole = args.data.role || args.where.role; 
      const userId = args.where.id || args.data.id; 
  
      // Check if the User being modified or created exists
      let existingUser = null;
      if (userId) {
        existingUser = await prisma.user.findUnique({
          where: { id: userId },
        });
      }
  
      // Admin-specific checks
      if (args.data.privileges) {
        if (userRole !== 'ADMIN') {
          throw new Error('Only admins can set or update privileges.');
        }
  
        if (existingUser && existingUser.role !== 'ADMIN') {
          throw new Error('Admins cannot update other users privileges.');
        }
      }
  
      // Participant-specific checks
      if (args.data.statutInscription) {
        if (userRole !== 'PARTICIPANT') {
          throw new Error('Only participants can set statutInscription.');
        }
  
        if (existingUser && existingUser.role !== 'PARTICIPANT') {
          throw new Error('Only participants can update statutInscription.');
        }
      }
  
      // Speaker-specific checks
      if (args.data.biographie || args.data.specialite || args.data.experience) {
        if (userRole !== 'SPEAKER') {
          throw new Error('Only speakers can update biographie, specialite, or experience.');
        }
  
        if (existingUser && existingUser.role !== 'SPEAKER') {
          throw new Error('Only speakers can modify their own biographie, specialite, or experience.');
        }
      }
  
      // General checks for updating role or attributes that are restricted
      if (args.data.role) {
        if (existingUser && existingUser.role !== 'ADMIN') {
          throw new Error('Only admins can change user roles.');
        }
  
        if (existingUser && existingUser.role !== 'ADMIN' && args.data.role === 'ADMIN') {
          throw new Error('Non-admin users cannot set themselves as admin.');
        }
      }
  
      
      if (args.data.documents) {
        if (userRole !== 'ADMIN' && userRole !== 'SPEAKER') {
          throw new Error('Only admins and speakers can modify documents.');
        }
      }
  
      if (args.data.sessions) {
        if (userRole !== 'ADMIN' && userRole !== 'SPEAKER') {
          throw new Error('Only admins and speakers can modify sessions.');
        }
      }
    }
    
    return next(params);
  });
export default prisma;
