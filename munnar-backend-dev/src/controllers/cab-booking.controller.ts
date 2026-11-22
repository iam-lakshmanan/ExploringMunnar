import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { CabBookingService } from "../services/cab-booking.service";
import { sendSuccess } from "../utils/response.util";
import { ApiError } from "../utils/api-error";
import { CabBookingDTO, GetCabBookingsDTO} from "../dto/cab-booking.dto";
import { UpdateStatusDTO } from "../dto/status-update.dto";

const service = new CabBookingService();

export const createCabBooking = async (req: Request, res: Response) => {
  try {
    const data: CabBookingDTO = req.body;

    const result = await service.createCabBooking(data);

    return sendSuccess(res, StatusCodes.CREATED, "Cab booking created successfully", result);
  } catch (err: any) {
    console.log("❌ Caught error:", err);
    throw new ApiError(
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      err.message,
      err.type || "DatabaseError"
    );
  }
};

export const getCabBookings = async (req: Request, res: Response) => {
  try {
    const data: GetCabBookingsDTO = req.body;

    const result = await service.getCabBookings(data);

    return sendSuccess(
      res,
      StatusCodes.OK,
      "Cab bookings retrieved successfully",
      result
    );
  } catch (err: any) {
    console.log("❌ Caught error:", err);
    throw new ApiError(
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      err.message,
      err.type || "DatabaseError"
    );
  }
};

export const updateCabBookingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data: UpdateStatusDTO = req.body;

    const bookingId = parseInt(id);
    if (isNaN(bookingId) || bookingId <= 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid booking ID", "ValidationError");
    }

    const result = await service.updateCabBookingStatus(bookingId, data);

    return sendSuccess(
      res,
      StatusCodes.OK,
      "Cab booking status updated successfully",
      result
    );
  } catch (err: any) {
    console.log("❌ Caught error:", err);
    throw new ApiError(
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      err.message,
      err.type || "DatabaseError"
    );
  }
};

export const getAllCabBookings = async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getAllCabBookings(status, search);

    return sendSuccess(
      res,
      StatusCodes.OK,
      "All cab bookings retrieved successfully",
      result
    );
  } catch (err: any) {
    console.error("❌ Caught error:", err);
    throw new ApiError(
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      err.message,
      err.type || "DatabaseError"
    );
  }
};

export const getCabBookingById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid booking ID", "ValidationError");
    }

    const result = await service.getCabBookingById(id);

    return sendSuccess(
      res,
      StatusCodes.OK,
      "Cab booking retrieved successfully",
      result
    );
  } catch (err: any) {
    console.error("❌ Caught error:", err);
    throw new ApiError(
      err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      err.message,
      err.type || "DatabaseError"
    );
  }
};
