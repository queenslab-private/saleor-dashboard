// <reference types="cypress" />
import faker from "faker";

import Channels from "../apiRequests/Channels";
import { LEFT_MENU_SELECTORS } from "../elements/account/left-menu/left-menu-selectors";
import { PRODUCTS_SELECTORS } from "../elements/catalog/product-selectors";
import { ADD_CHANNEL_FORM_SELECTORS } from "../elements/channels/add-channel-form-selectors";
import { CHANNEL_FORM_SELECTORS } from "../elements/channels/channel-form-selectors";
import { CHANNELS_SELECTORS } from "../elements/channels/channels-selectors";
import { CONFIGURATION_SELECTORS } from "../elements/configuration/configuration-selectors";
import { HEADER_SELECTORS } from "../elements/header/header-selectors";
import { DRAFT_ORDER_SELECTORS } from "../elements/orders/draft-order-selectors";
import { ORDERS_SELECTORS } from "../elements/orders/orders-selectors";
import { BUTTON_SELECTORS } from "../elements/shared/button-selectors";
import ChannelsSteps from "../steps/channelsSteps";
import { urlList } from "../url/urlList";
import ChannelsUtils from "../utils/channelsUtils";

describe("Channels", () => {
  const channelStartsWith = "Cypress:";
  const currency = "PLN";
  const channels = new Channels();
  const channelsUtils = new ChannelsUtils();
  const channelsSteps = new ChannelsSteps();

  before(() => {
    cy.clearSessionData().loginUserViaRequest();
    channelsUtils.deleteChannels(channelStartsWith);
  });

  beforeEach(() => {
    cy.clearSessionData().loginUserViaRequest();
  });

  it("should navigate to channels page", () => {
    cy.visit(urlList.homePage)
      .get(LEFT_MENU_SELECTORS.configuration)
      .click()
      .get(CONFIGURATION_SELECTORS.channels)
      .click()
      .location("pathname")
      .should("contain", "channels");
  });

  it("should create new channel", () => {
    const randomChannel = `${channelStartsWith} ${faker.random.number()}`;
    cy.visit(urlList.channels).waitForGraph("Channels");
    channelsSteps.createChannelByView(randomChannel, currency);
    // New channel should be visible in channels list
    cy.waitForGraph("Channel")
      .get(ADD_CHANNEL_FORM_SELECTORS.backToChannelsList)
      .click()
      .get(CHANNELS_SELECTORS.channelsTable)
      .contains(randomChannel);

    // new channel should be visible in channel selector
    cy.visit(urlList.homePage)
      .get(HEADER_SELECTORS.channelSelect)
      .click()
      .get(HEADER_SELECTORS.channelSelectList)
      .contains(randomChannel)
      .click();

    // new channel should be visible at product availability form
    cy.visit(urlList.products).waitForGraph("InitialProductFilterData");
    cy.get(PRODUCTS_SELECTORS.productsList)
      .first()
      .click()
      .get(PRODUCTS_SELECTORS.availableManageButton)
      .click()
      .get(PRODUCTS_SELECTORS.channelsAvailabilityForm)
      .contains(randomChannel);
  });

  it("should validate slug name", () => {
    const randomChannel = `${channelStartsWith} ${faker.random.number()}`;
    channels.createChannel(false, randomChannel, randomChannel, currency);
    cy.visit(urlList.channels);
    channelsSteps.createChannelByView(randomChannel, currency);
    cy.get(ADD_CHANNEL_FORM_SELECTORS.slugValidationMessage).should(
      "be.visible"
    );
  });

  it("should validate currency", () => {
    const randomChannel = `${channelStartsWith} ${faker.random.number()}`;
    cy.visit(urlList.channels);
    channelsSteps.createChannelByView(
      randomChannel,
      currency,
      "notExistingCurrency"
    );
    cy.get(ADD_CHANNEL_FORM_SELECTORS.currencyValidationMessage).should(
      "be.visible"
    );
  });

  it("should delete channel", () => {
    const randomChannelToDelete = `${channelStartsWith} ${faker.random.number()}`;
    channels.createChannel(
      false,
      randomChannelToDelete,
      randomChannelToDelete,
      currency
    );
    cy.visit(urlList.channels).waitForGraph("Channels");
    cy.get(CHANNELS_SELECTORS.channelName)
      .contains(randomChannelToDelete)
      .parentsUntil(CHANNELS_SELECTORS.channelsTable)
      .find("button")
      .click()
      .get(BUTTON_SELECTORS.submit)
      .click()
      .waitForGraph("Channels");
    cy.get(CHANNELS_SELECTORS.channelName)
      .contains(randomChannelToDelete)
      .should("not.exist");
  });

  it("should not be possible to add products to order with inactive channel", () => {
    const randomChannel = `${channelStartsWith} ${faker.random.number()}`;
    channels.createChannel(false, randomChannel, randomChannel, currency);
    cy.visit(urlList.orders)
      .get(ORDERS_SELECTORS.createOrder)
      .click()
      .get(CHANNEL_FORM_SELECTORS.channelSelect)
      .click()
      .get(CHANNEL_FORM_SELECTORS.channelOption)
      .contains(randomChannel)
      .click()
      .get(CHANNEL_FORM_SELECTORS.confirmButton)
      .click();
    cy.location()
      .should(loc => {
        const urlRegex = new RegExp(`${urlList.orders}.+`, "g");
        expect(loc.pathname).to.match(urlRegex);
      })
      .get(DRAFT_ORDER_SELECTORS.addProducts)
      .should("not.exist");
  });
});
