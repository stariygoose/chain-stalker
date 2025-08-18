import axios from "axios";
import { injectable, inject } from "inversify";

import { TYPES } from "#di/types.js";
import { EnvVariables, IConfigService } from "#config/index.js";
import { createSignature } from "#lib/helpers/helpers.js";

@injectable()
export class HttpService {
  public static readonly V1_URL: string = "/api/v1";

  public static readonly CREATE_URL: string = `${HttpService.V1_URL}/subscriptions/create`;
  public static readonly TOKEN_URL: string = `${HttpService.V1_URL}/token`;
  public static readonly COLLECTION_URL: string = `${HttpService.V1_URL}/collection`;

  public static readonly SUBSCRIPTIONS_URL: string = `${HttpService.V1_URL}/subscriptions`;
  public static readonly SUBSCRIPTION_DELETE: string = `${HttpService.SUBSCRIPTIONS_URL}/delete`;
  public static readonly SUBSCRIPTIONS_CHANGE_STATUS_URL: string = `${HttpService.SUBSCRIPTIONS_URL}/change_status`;

  public static readonly STRATEGY_URL: string = `${HttpService.V1_URL}/strategy`;
  public static readonly STRATEGY_EDIT: string = `${HttpService.STRATEGY_URL}/update`;

  public static readonly REGISTER_URL: string = `${HttpService.V1_URL}/auth/bot-register`;

  private readonly BASE_URL: string;
  private readonly AUTHORIZATION: string;
  private readonly BOT_SECRET_KEY: string;

  constructor(
    @inject(TYPES.ConfigService)
    private readonly _configService: IConfigService,
  ) {
    this.BASE_URL = this._configService.get(EnvVariables.SERVER_URL);
    const botServiceName = this._configService.get(
      EnvVariables.BOT_SERVICE_NAME,
    );

    this.BOT_SECRET_KEY = this._configService.get(EnvVariables.TG_BOT_TOKEN);
    this.AUTHORIZATION = `Bot ${botServiceName}`;
  }

  public async get<T>(endpoint: string, userId: string): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;
    const timestamp = Date.now().toString();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: this.AUTHORIZATION,
      "x-bot-timestamp": timestamp,
      "x-telegram-user-id": userId,
      "x-bot-signature": createSignature(
        timestamp,
        userId,
        "GET",
        endpoint,
        this.BOT_SECRET_KEY,
      ),
    };

    try {
      const response = await axios.get<T>(url, {
        headers,
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  public async post<T>(
    endpoint: string,
    data: unknown,
    userId: string,
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;
    const timestamp = Date.now().toString();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: this.AUTHORIZATION,
      "x-bot-timestamp": timestamp,
      "x-telegram-user-id": userId,
      "x-bot-signature": createSignature(
        timestamp,
        userId,
        "POST",
        endpoint,
        this.BOT_SECRET_KEY,
      ),
    };

    try {
      const response = await axios.post<T>(url, data, {
        headers,
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  public async put<T>(
    endpoint: string,
    data: unknown,
    userId: string,
  ): Promise<T> {
    const url = `${this.BASE_URL}${endpoint}`;
    const timestamp = Date.now().toString();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: this.AUTHORIZATION,
      "x-bot-timestamp": timestamp,
      "x-telegram-user-id": userId,
      "x-bot-signature": createSignature(
        timestamp,
        userId,
        "PUT",
        endpoint,
        this.BOT_SECRET_KEY,
      ),
    };

    try {
      const response = await axios.put<T>(url, data, {
        headers,
      });

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  public async delete(endpoint: string, userId: string): Promise<void> {
    const url = `${this.BASE_URL}${endpoint}`;
    const timestamp = Date.now().toString();

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: this.AUTHORIZATION,
      "x-bot-timestamp": timestamp,
      "x-telegram-user-id": userId,
      "x-bot-signature": createSignature(
        timestamp,
        userId,
        "DELETE",
        endpoint,
        this.BOT_SECRET_KEY,
      ),
    };

    try {
      await axios.delete(url, {
        headers: headers,
      });
    } catch (error: any) {
      throw error;
    }
  }
}
