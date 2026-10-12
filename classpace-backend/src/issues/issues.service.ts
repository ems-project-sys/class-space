import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface AuthenticatedUser {
  sub: string;
}

export interface ReportIssueInput {
  roomId: string;
  description: string;
}

export interface ResolveIssueInput {
  resolution: string;
}

@Injectable()
export class IssuesService {
  constructor(private readonly prisma: PrismaService) {}

  async report(input: ReportIssueInput, user: AuthenticatedUser) {
    const room = await this.prisma.room.findUnique({
      where: { id: input.roomId },
    });

    if (!room) {
      throw new NotFoundException('Room not found.');
    }

    const existingIssue = await this.prisma.issue.findFirst({
      where: {
        roomId: input.roomId,
        status: 'OPEN',
      },
    });

    if (existingIssue) {
      throw new ConflictException('Room already has an open issue.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const issue = await transaction.issue.create({
        data: {
          roomId: input.roomId,
          reporterId: user.sub,
          description: input.description,
        },
      });

      await transaction.issueLog.create({
        data: {
          roomId: input.roomId,
          userId: user.sub,
          action: 'REPORT',
          description: input.description,
        },
      });

      return issue;
    });
  }

  async resolve(
    issueId: string,
    input: ResolveIssueInput,
    user: AuthenticatedUser,
  ) {
    const issue = await this.prisma.issue.findUnique({
      where: { id: issueId },
    });

    if (!issue) {
      throw new NotFoundException('Issue not found.');
    }

    if (issue.status !== 'OPEN') {
      throw new ConflictException('Issue is already resolved.');
    }

    return this.prisma.$transaction(async (transaction) => {
      const resolvedIssue = await transaction.issue.update({
        where: { id: issueId },
        data: {
          status: 'CLOSED',
          resolverId: user.sub,
          resolution: input.resolution,
          resolvedAt: new Date(),
        },
      });

      await transaction.issueLog.create({
        data: {
          roomId: issue.roomId,
          userId: user.sub,
          action: 'RESOLVE',
          description: input.resolution,
        },
      });

      return resolvedIssue;
    });
  }
}
