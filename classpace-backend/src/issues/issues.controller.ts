import { Body, Controller, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
  AuthenticatedUser,
  ReportIssueInput,
  ResolveIssueInput,
} from './issues.service';
import { IssuesService } from './issues.service';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

@Controller('api/issues')
@UseGuards(JwtAuthGuard)
export class IssuesController {
  constructor(private readonly issuesService: IssuesService) {}

  @Post()
  report(
    @Body() input: ReportIssueInput,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.issuesService.report(input, request.user);
  }

  @Patch(':id/resolve')
  resolve(
    @Param('id') id: string,
    @Body() input: ResolveIssueInput,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.issuesService.resolve(id, input, request.user);
  }
}
