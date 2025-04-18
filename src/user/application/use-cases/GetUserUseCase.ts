import { IUserRepository } from '../repositories/IUserRepository';
import { UserOutputDTO } from '../dtos/UserDTO';
import { DID } from '../../domain/value-objects/DID';
// import { UserMapper } from '../../infrastructure/persistence/mappers/UserMapper'; // Assuming a mapper

export class GetUserUseCase {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(didString: string): Promise<UserOutputDTO | null> {
    const did = new DID(didString); // Validate input format
    const user = await this.userRepo.findById(did);

    if (!user) {
      return null;
    }

    // TODO: Implement UserMapper or map manually
    const userDto: UserOutputDTO = {
      id: user.id.toString(),
      handle: user.handle.toString(),
      linkedAt: user.linkedAt.toISOString(),
      lastLoginAt: user.lastLoginAt.toISOString(),
    };

    return userDto;
  }
}
