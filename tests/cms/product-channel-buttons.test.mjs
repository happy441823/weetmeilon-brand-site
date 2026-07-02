import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { ProductChannelButtons } from "../../src/components/ProductChannelButtons.tsx";

globalThis.React = React;

test("product cards show enabled Tmall links before manual link verification", () => {
  const product = {
    id: "tmall-1055096918525",
    slug: "tmall-1055096918525",
    channelLinks: {
      tmall: {
        enabled: true,
        verified: false,
        url: "https://detail.tmall.com/item.htm?id=1055096918525",
        label: "Tmall flagship store"
      },
      jd: {
        enabled: false,
        verified: false,
        url: null,
        label: "JD flagship store"
      }
    }
  };

  const element = ProductChannelButtons({ product, source: "product_card" });
  assert.ok(element);

  const anchors = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].props.href, "https://detail.tmall.com/item.htm?id=1055096918525");
});

test("product cards still hide disabled channel links", () => {
  const product = {
    id: "tmall-draft",
    slug: "tmall-draft",
    channelLinks: {
      tmall: {
        enabled: false,
        verified: true,
        url: "https://detail.tmall.com/item.htm?id=1",
        label: "Tmall flagship store"
      },
      jd: {
        enabled: false,
        verified: true,
        url: "https://item.jd.com/1.html",
        label: "JD flagship store"
      }
    }
  };

  assert.equal(ProductChannelButtons({ product, source: "product_card" }), null);
});
