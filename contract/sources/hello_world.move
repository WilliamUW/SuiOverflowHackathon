// Copyright (c) 2022, Sui Foundation
// SPDX-License-Identifier: Apache-2.0

/// A basic Hello World example for Sui Move, part of the Sui Move intro course:
/// https://github.com/sui-foundation/sui-move-intro-course
///
module hello_world::hello_world;

use std::string;
use std::vector;
use sui::object::{Self, UID};
use sui::transfer;
use sui::tx_context::{Self, TxContext};
use sui::clock::{Self, Clock};

/// An object that contains an arbitrary string
public struct HelloWorldObject has key, store {
    id: UID,
    /// A string contained in the object
    text: string::String,
}

/// Structure to store interview data
public struct InterviewData has store, copy, drop {
    user_address: address,
    company_name: string::String,
    interview_question: string::String,
    timestamp: u64,
}

/// Structure to store interview history
public struct InterviewHistory has key {
    id: UID,
    interviews: vector<InterviewData>,
}

#[lint_allow(self_transfer)]
public fun mint(ctx: &mut TxContext) {
    let object = HelloWorldObject {
        id: object::new(ctx),
        text: string::utf8(b"Hello World!"),
    };
    transfer::public_transfer(object, tx_context::sender(ctx));
}

/// Function to store interview data
public fun store_interview(
    interview_history: &mut InterviewHistory,
    company_name: string::String,
    interview_question: string::String,
    ctx: &mut TxContext,
    clock: &Clock,
) {
    let interview_data = InterviewData {
        user_address: tx_context::sender(ctx),
        company_name,
        interview_question,
        timestamp: clock::timestamp_ms(clock),
    };
    vector::push_back(&mut interview_history.interviews, interview_data);
}

/// Function to create a new interview history object
public fun create_interview_history(ctx: &mut TxContext): InterviewHistory {
    InterviewHistory {
        id: object::new(ctx),
        interviews: vector::empty(),
    }
}
