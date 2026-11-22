import { Prisma } from "@prisma/client";
import { prisma } from "../prisma-client";
import { GetBikeRentalDTO } from "../dto/bike-rental.dto";

export class BikeRentalRepository {
  async create(data: Prisma.BikeRentalCreateInput) {
    try {
      return await prisma.bikeRental.create({ data });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error while creating bike rental: ${err.message}`);
      }
      throw err;
    }
  }

  async getBikeRentals(dto: GetBikeRentalDTO) {
    try {
      const skip = (dto.page - 1) * dto.limit;

      // Build where clause
      const where: Prisma.BikeRentalWhereInput = {
        is_active: true,
      };

      if (dto.userName) {
        where.user = {
          name: {
            contains: dto.userName,
            mode: "insensitive",
          },
        };
      }

      if (dto.status) {
        where.status = dto.status as any;
      }

      // Get total count for pagination info
      const total = await prisma.bikeRental.count({ where });

      // Get paginated results ordered by latest created
      const rentals = await prisma.bikeRental.findMany({
        where,
        select: {
          id: true,
          user_id: true,
          name: true,
          email: true,
          pickup_location: true,
          drop_location: true,
          date: true,
          time: true,
          mobile_number: true,
          no_of_days: true,
          driver_needed: true,
          status: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: dto.limit,
      });

      // Map to response format
      const mappedRentals = rentals.map(({ user, ...rest }) => ({
        id: rest.id,
        name: rest.name,
        email: rest.email,
        from: rest.pickup_location,
        to: rest.drop_location,
        phone: rest.mobile_number,
        date: rest.date.toISOString().split('T')[0],
        time: rest.time,
        noOfDays: rest.no_of_days,
        driverNeeded: rest.driver_needed ? "Yes" : "No",
        status: rest.status,
      }));

      return {
        data: mappedRentals,
        pagination: {
          page: dto.page,
          limit: dto.limit,
          total,
          totalPages: Math.ceil(total / dto.limit),
        },
      };
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Database error while fetching bike rentals: ${err.message}`
        );
      }
      throw err;
    }
  }

  async updateStatus(id: number, status: string) {
    try {
      return await prisma.bikeRental.update({
        where: { id },
        data: { status: status as any },
      });
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2025") {
          throw new Error(`Bike rental with ID ${id} not found`);
        }
        throw new Error(`Database error while updating bike rental: ${err.message}`);
      }
      throw err;
    }
  }
  async getAllBikeRentals(status?: string, search?: string) {
    try {
      const where: Prisma.BikeRentalWhereInput = {
        is_active: true,
        ...(status ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { user: { name: { contains: search, mode: "insensitive" } } },
                { pickup_location: { contains: search, mode: "insensitive" } },
                { drop_location: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const rentals = await prisma.bikeRental.findMany({
        where,
        select: {
          id: true,
          user_id: true,
          name: true,
          email: true,
          pickup_location: true,
          drop_location: true,
          date: true,
          time: true,
          mobile_number: true,
          no_of_days: true,
          driver_needed: true,
          status: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
      });

      return rentals.map(({ user, ...rest }) => ({
        id: rest.id,
        user_id: rest.user_id,
        name: rest.name,
        email: rest.email,
        from: rest.pickup_location,
        to: rest.drop_location,
        phone: rest.mobile_number,
        date: rest.date.toISOString().split('T')[0],
        time: rest.time,
        noOfDays: rest.no_of_days,
        driverNeeded: rest.driver_needed ? "Yes" : "No",
        status: rest.status,
        user_name: user?.name,
        is_active: rest.is_active,
        created_at: rest.created_at,
        updated_at: rest.updated_at,
      }));
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(
          `Database error while fetching all bike rentals: ${err.message}`
        );
      }
      throw err;
    }
  }

  async getBikeRentalById(id: number) {
    try {
      const rental = await prisma.bikeRental.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      });
      return rental;
    } catch (err: any) {
      throw err;
    }
  }

}
