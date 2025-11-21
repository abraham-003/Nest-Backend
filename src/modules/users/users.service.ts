import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'; // Remember to install: npm install bcrypt

import { User } from './entities/user.entity';
import { RegisterDto } from '../auth/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'role')
      .leftJoinAndSelect('role.permissions', 'permission')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const exists = await this.findByEmail(dto.email);
    if (exists) {
      // Fix 1: Imported and used BadRequestException
      throw new BadRequestException('Email already taken');
    }

    // 2. Hash the password
    // Fix 2: Using the imported bcrypt package for hashing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 3. Create the user entity instance in memory
    // Fix 3: Use 'this.repo' (the injected TypeORM Repository) instead of 'this.users'
    const user = this.repo.create({
      ...dto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      password: hashedPassword,
    });

    // 4. Save the user to the database
    const savedUser = await this.repo.save(user);

    // 5. Remove password before returning the object to the calling service/controller
    // A ClassSerializerInterceptor is the preferred way, but this works for demonstration.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = savedUser;

    // NOTE: The call to 'this.issueTokens(user)' was removed.
    // Token issuing should happen in the AuthService after the UsersService successfully
    // registers the user.

    return userWithoutPassword as Omit<User, 'password'>;
  }
}
