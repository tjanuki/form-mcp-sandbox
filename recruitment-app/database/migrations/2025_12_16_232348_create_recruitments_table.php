<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('recruitments', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('company_name');
            $table->string('location');
            $table->enum('employment_type', ['full-time', 'part-time', 'contract', 'internship']);
            $table->decimal('salary_min', 10, 2)->nullable();
            $table->decimal('salary_max', 10, 2)->nullable();
            $table->string('salary_currency', 10)->default('USD');
            $table->text('description');
            $table->text('requirements');
            $table->text('responsibilities');
            $table->text('benefits')->nullable();
            $table->date('application_deadline')->nullable();
            $table->enum('status', ['draft', 'published', 'closed', 'filled'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recruitments');
    }
};
